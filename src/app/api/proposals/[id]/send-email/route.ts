import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import nodemailer from 'nodemailer';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { to, subject, message, cc } = await req.json();

    const proposal = await db.proposal.findUnique({
      where: { id },
      include: { items: true, additionalChargeItems: true },
    });
    if (!proposal) return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><style>
  body { font-family: Arial, sans-serif; color: #1e293b; background: #f8fafc; margin:0;padding:0; }
  .container { max-width: 600px; margin: 24px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
  .header { background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 32px; text-align: center; }
  .header h1 { margin: 0; font-size: 22px; }
  .header p { margin: 8px 0 0; opacity: .85; font-size: 13px; }
  .body { padding: 28px 32px; }
  .meta { background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0; font-size: 13px; }
  .meta table { width: 100%; border-collapse: collapse; }
  .meta td { padding: 5px 0; vertical-align: top; }
  .meta td:first-child { color: #64748b; width: 140px; font-weight:500; }
  .meta td:last-child { font-weight: 600; color: #1e293b; }
  .total { background: #7c3aed; color: white; text-align: center; padding: 16px; border-radius: 8px; margin: 20px 0; }
  .total p { margin: 0; font-size: 13px; opacity: .9; }
  .total h2 { margin: 6px 0 0; font-size: 28px; font-weight:800; }
  .footer { background: #f8fafc; padding: 20px 32px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <h1>📋 Project Proposal</h1>
    <p>${proposal.proposalNumber} · TechInPedia</p>
  </div>
  <div class="body">
    <p style="font-size:15px">Dear <strong>${proposal.contactPerson || proposal.clientName}</strong>,</p>
    <p style="font-size:14px;color:#475569;line-height:1.6">${(message || '').replace(/\n/g, '<br/>')}</p>
    <div class="meta">
      <table>
        <tr><td>Proposal No</td><td>${proposal.proposalNumber}</td></tr>
        <tr><td>Project</td><td>${proposal.title}</td></tr>
        <tr><td>Date</td><td>${new Date(proposal.proposalDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</td></tr>
        <tr><td>Valid Until</td><td>${proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) : 'N/A'}</td></tr>
        <tr><td>Prepared By</td><td>${proposal.preparedBy || 'TechInPedia Team'}</td></tr>
      </table>
    </div>
    <div class="total">
      <p>Total Proposal Value</p>
      <h2>₹${proposal.grandTotal.toLocaleString('en-IN')}</h2>
    </div>
    <p style="font-size:13px;color:#475569">Please review the proposal and feel free to reach out with any questions. We look forward to your valuable feedback.</p>
    <p style="font-size:13px;color:#475569;margin-top:20px">Best regards,<br/><strong>${proposal.preparedBy || 'TechInPedia Team'}</strong><br/>TechInPedia</p>
  </div>
  <div class="footer">TechInPedia · techinpedia.com<br/>This proposal is valid until ${proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('en-IN') : 'further notice'}</div>
</div>
</body>
</html>`;

    const transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from:    `"TechInPedia" <${process.env.SMTP_USER}>`,
      to:      to || proposal.clientEmail,
      cc:      cc || undefined,
      subject: subject || `Proposal: ${proposal.title} — ${proposal.proposalNumber}`,
      html:    emailHtml,
    });

    // Mark as SENT
    await db.proposal.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[send-email]', err);
    return NextResponse.json({ error: err.message || 'Failed to send email' }, { status: 500 });
  }
}
