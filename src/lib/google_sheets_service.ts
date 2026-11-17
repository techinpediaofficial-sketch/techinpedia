/**
 * TechInPedia Official Google Sheets API v4 Service
 * Production-ready Service Account & OAuth authentication, visual column mapping,
 * bidirectional syncing, deduplication, and loop-prevention.
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from './db';
import { decryptCredential } from './encryption';
import { getAccessibleBusinessUnits } from '@/lib/business-units';
import { createEnquiry } from '@/lib/crm/create-lead';
import { normalizePhone, buildPhoneSearchFilters } from './phone';
import { recordLeadTimelineEvent, calculateLeadScore } from './crm';
import { emitWorkflowEvent } from './workflow/eventEmitter';
import { sendWhatsAppTemplateMessage } from './whatsapp_service';

/**
 * Normalizes a Google Service Account private key to a valid PEM format.
 * Handles all common storage formats: literal \\n, double-escaped \\\\n, JSON strings, etc.
 */
function normalizePrivateKey(raw: string): string {
  let key = raw.trim();

  // If it looks like a JSON string (starts with "), try to parse it first
  if (key.startsWith('"') && key.endsWith('"')) {
    try { key = JSON.parse(key); } catch { /* ignore */ }
  }

  // Replace all variants of escaped newlines with actual newlines
  key = key
    .replace(/\\n/g, '\n')   // literal \n  -> newline
    .replace(/\\\\n/g, '\n') // literal \\n -> newline
    .replace(/\r/g, '');      // strip carriage returns

  // Ensure PEM header and footer have newlines around them
  key = key
    .replace(/-----BEGIN PRIVATE KEY-----\s*/g, '-----BEGIN PRIVATE KEY-----\n')
    .replace(/\s*-----END PRIVATE KEY-----/g, '\n-----END PRIVATE KEY-----');

  return key;
}

export interface GoogleAuthCredentials {
  clientEmail: string;
  privateKey: string;
}

/**
 * Resolves active Google Service Account credentials from DB (priority) or environment variables.
 */
export async function getActiveGoogleCredentials(): Promise<GoogleAuthCredentials | null> {
  try {
    const dbConn = await db.googleConnection.findFirst({
      where: { status: 'CONNECTED' },
      orderBy: { updatedAt: 'desc' },
    });

    if (dbConn && dbConn.clientEmail && dbConn.privateKeyEncrypted) {
      const decryptedKey = decryptCredential(dbConn.privateKeyEncrypted);
      if (decryptedKey) {
        return {
          clientEmail: dbConn.clientEmail,
          privateKey: normalizePrivateKey(decryptedKey),
        };
      }
    }
  } catch (err) {
    console.error('Error reading DB Google connection:', err);
  }

  // Fallback to environment variables
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '';
  const key = process.env.GOOGLE_PRIVATE_KEY || '';

  if (email && key) {
    return {
      clientEmail: email,
      privateKey: normalizePrivateKey(key),
    };
  }

  return null;
}

/**
 * Obtains a Google OAuth2 access token using RSA-SHA256 JWT Bearer Grant.
 */
export async function getGoogleAccessToken(): Promise<string> {
  const creds = await getActiveGoogleCredentials();
  if (!creds) {
    throw new Error('Google Sheets is not configured. Please provide Google Service Account credentials.');
  }

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: creds.clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const signedJwt = jwt.sign(claim, creds.privateKey, { algorithm: 'RS256' });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: signedJwt,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) {
    throw new Error(tokenData.error_description || tokenData.error || 'Failed to obtain Google OAuth access token');
  }

  return tokenData.access_token;
}

/**
 * Explores a spreadsheet: returns title, worksheets (tabs), and column headers from row 1.
 */
export async function exploreSpreadsheet(spreadsheetId: string, sheetTabName?: string): Promise<{
  title: string;
  sheets: string[];
  headers: string[];
  sampleRows: Record<string, string>[];
}> {
  const token = await getGoogleAccessToken();

  // 1. Fetch metadata
  const metaRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const metaData = await metaRes.json();
  if (!metaRes.ok) {
    throw new Error(metaData.error?.message || `Failed to fetch spreadsheet ${spreadsheetId}`);
  }

  const title = metaData.properties?.title || 'Google Sheet';
  const sheets = (metaData.sheets || []).map((s: any) => s.properties?.title || 'Sheet1');
  const targetTab = sheetTabName || sheets[0] || 'Sheet1';

  // 2. Fetch first 10 rows from the target worksheet
  const valuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(targetTab)}!A1:Z10`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  const valuesData = await valuesRes.json();
  const rows = valuesData.values || [];
  const headers = (rows[0] || []).map((h: any) => String(h || '').trim());

  const sampleRows: Record<string, string>[] = [];
  for (let r = 1; r < rows.length; r++) {
    const rowObj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      rowObj[headers[c]] = String(rows[r]?.[c] || '').trim();
    }
    sampleRows.push(rowObj);
  }

  return { title, sheets, headers, sampleRows };
}

/**
 * Synchronizes Inbound rows from Google Sheet into CRM Leads with deduplication and auto-assignment.
 */
export async function syncInboundSheetLeads(configId: string): Promise<{
  success: boolean;
  rowsScanned: number;
  leadsCreated: number;
  leadsUpdated: number;
  duplicatesSkipped: number;
  errorsCount: number;
  details: string[];
}> {
  const config = await db.googleSheetSyncConfig.findUnique({
    where: { id: configId },
  });

  if (!config) {
    throw new Error('Google Sheet configuration not found.');
  }

  const token = await getGoogleAccessToken();
  const columnMapping: Record<string, string> = JSON.parse(config.columnMapping || '{}');

  // Fetch all rows from spreadsheet worksheet
  const range = `${encodeURIComponent(config.sheetName)}!A1:Z500`;
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/${range}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || 'Failed to read spreadsheet values');
  }

  const rows = data.values || [];
  if (rows.length <= 1) {
    return {
      success: true,
      rowsScanned: 0,
      leadsCreated: 0,
      leadsUpdated: 0,
      duplicatesSkipped: 0,
      errorsCount: 0,
      details: ['No data rows found in worksheet.'],
    };
  }

  const headers = (rows[0] || []).map((h: any) => String(h || '').trim());
  const headerIndexMap = new Map<string, number>();
  headers.forEach((h: string, idx: number) => headerIndexMap.set(h, idx));

  let leadsCreated = 0;
  let leadsUpdated = 0;
  let duplicatesSkipped = 0;
  let errorsCount = 0;
  const details: string[] = [];

  // Inbound loop
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];

    // Map columns — tries ALL headers mapped to the same CRM field, returns first non-empty value
    const getVal = (crmField: string): string => {
      // columnMapping: { [sheetHeader]: crmField }
      const matchedHeaders = Object.keys(columnMapping).filter((k) => columnMapping[k] === crmField);
      for (const header of matchedHeaders) {
        const idx = headerIndexMap.get(header);
        const val = idx !== undefined ? String(row[idx] || '').trim() : '';
        if (val) return val;
      }
      return '';
    };

    const name = getVal('name') || getVal('first_name');
    const rawPhone = getVal('phone') || getVal('mobile');
    const email = getVal('email')?.toLowerCase();
    const company = getVal('company');
    const service = getVal('service') || 'General Enquiry';
    const city = getVal('city');
    const budget = getVal('budget');
    const message = getVal('message') || `Synced from Google Sheet (${config.name})`;

    if (!name && !email && !rawPhone) {
      continue; // Skip empty row
    }

    const normPhone = normalizePhone(rawPhone);

    // Deduplication check
    const searchClauses: any[] = [];
    if (email) searchClauses.push({ email });
    if (normPhone.isValid) {
      searchClauses.push(...buildPhoneSearchFilters(normPhone.canonical));
    }

    let existingLead = searchClauses.length > 0
      ? await db.enquiry.findFirst({ where: { OR: searchClauses } })
      : null;

    if (existingLead) {
      if (config.duplicateAction === 'SKIP') {
        duplicatesSkipped++;
        details.push(`Row ${r + 1}: Skipped existing lead [${name || email || normPhone.canonical}].`);
        continue;
      } else if (config.duplicateAction === 'UPDATE') {
        await db.enquiry.update({
          where: { id: existingLead.id },
          data: {
            name: name || existingLead.name,
            phone: normPhone.isValid ? normPhone.canonical : existingLead.phone,
            company: company || existingLead.company,
            service: service || existingLead.service,
            budget: budget || existingLead.budget,
          },
        });

        await recordLeadTimelineEvent({
          enquiryId: existingLead.id,
          type: 'STATUS_CHANGE',
          title: 'Lead Updated from Google Sheet',
          description: `Updated from worksheet ${config.sheetName} (Row ${r + 1}).`,
          actorEmail: 'system@google-sheets.sync',
        });

        leadsUpdated++;
        details.push(`Row ${r + 1}: Updated lead ${existingLead.id} [${name}].`);
        continue;
      }
    }

    // Determine Assignment
    let assignedUserId: string | null = config.defaultAssigneeId || null;
    if (config.assignmentStrategy === 'ROUND_ROBIN' && !assignedUserId) {
      const activeAgents = await db.user.findMany({
        where: { status: 'ACTIVE', role: { in: ['ADMIN', 'EDITOR'] } },
        take: 1,
      });
      if (activeAgents.length > 0) {
        assignedUserId = activeAgents[0].id;
      }
    }

    const score = calculateLeadScore({ phone: rawPhone, email, company, service, budget, message });

    // Create New Lead using centralized helper
    const newLead = await createEnquiry({
      name: name || 'Google Sheet Lead',
      email: email || `sheet_lead_${Date.now()}_${r}@techinpedia.customer`,
      phone: normPhone.isValid ? normPhone.canonical : rawPhone || undefined,
      company: company || undefined,
      service: service || 'Web Development',
      budget: budget || undefined,
      message: message || `Imported from Google Sheet [Row ${r}]`,
      source: 'Google Sheets Import',
    });

    // Update with specific fields from the sheets sync
    await db.enquiry.update({
      where: { id: newLead.id },
      data: {
        status: 'NEW',
        assignedTo: assignedUserId,
        score,
        temperature: score >= 60 ? 'HOT' : score >= 35 ? 'WARM' : 'COLD',
      },
    });
    newLead.status = 'NEW';
    newLead.assignedTo = assignedUserId;
    newLead.score = score;
    newLead.temperature = score >= 60 ? 'HOT' : score >= 35 ? 'WARM' : 'COLD';

    await recordLeadTimelineEvent({
      enquiryId: newLead.id,
      type: 'CREATED',
      title: 'Lead Synced from Google Sheet',
      description: `Inbound lead from spreadsheet "${config.name}" (Row ${r + 1}). Initial Score: ${score}/100.`,
      actorEmail: 'system@google-sheets.sync',
    });

    // Auto WhatsApp Welcome Template trigger if enabled
    if (config.enableAutoWhatsApp && config.whatsAppTemplateId && normPhone.isValid) {
      const template = await db.whatsappTemplate.findUnique({
        where: { id: config.whatsAppTemplateId },
      });
      if (template && template.status === 'APPROVED') {
        await sendWhatsAppTemplateMessage(
          normPhone.canonical,
          template.name,
          template.language,
          [newLead.name, newLead.service || 'our services']
        ).catch((err) => console.error('Auto WhatsApp template error on sheet import:', err));
      }
    }

    // Emit Workflow Trigger
    await emitWorkflowEvent('integrations.sheets.lead_imported', {
      entityId: newLead.id,
      entityType: 'Enquiry',
      data: {
        lead: {
          id: newLead.id,
          name: newLead.name,
          email: newLead.email,
          phone: newLead.phone,
          service: newLead.service,
          source: newLead.source,
        },
        spreadsheetId: config.spreadsheetId,
        sheetName: config.sheetName,
        rowNumber: r + 1,
      },
    });

    leadsCreated++;
    details.push(`Row ${r + 1}: Created new lead [${newLead.name} - ${newLead.phone || newLead.email}].`);
  }

  // Update Config record
  await db.googleSheetSyncConfig.update({
    where: { id: configId },
    data: {
      lastSyncAt: new Date(),
      lastRowImported: rows.length,
      lastError: null,
    },
  });

  // Log execution
  await db.googleSheetSyncLog.create({
    data: {
      configId,
      syncType: 'MANUAL',
      rowsScanned: rows.length - 1,
      leadsCreated,
      leadsUpdated,
      duplicatesSkipped,
      errorsCount,
      details: JSON.stringify(details.slice(0, 50)),
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  });

  return {
    success: true,
    rowsScanned: rows.length - 1,
    leadsCreated,
    leadsUpdated,
    duplicatesSkipped,
    errorsCount,
    details,
  };
}

/**
 * Appends a lead row to a target Google Sheet with loop prevention hash.
 */
export async function appendLeadToSheet(
  spreadsheetId: string,
  sheetName: string,
  lead: { name: string; phone?: string | null; email?: string | null; service?: string | null; status?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const token = await getGoogleAccessToken();
    const recordHash = crypto.createHash('md5').update(`${lead.name}:${lead.email}:${lead.phone}`).digest('hex');

    const values = [
      [
        lead.name,
        lead.phone || '',
        lead.email || '',
        lead.service || '',
        lead.status || 'NEW',
        new Date().toISOString(),
        recordHash, // Hidden hash for loop prevention
      ],
    ];

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error?.message || 'Failed to append row' };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error appending to Google Sheet' };
  }
}
