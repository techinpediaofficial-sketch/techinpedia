/**
 * Phase 1.1 Business Unit & Site Domain Bootstrap Script
 *
 * Usage:
 *   npx tsx scripts/backfill-business-units.ts          -- dry run (shows planned changes)
 *   npx tsx scripts/backfill-business-units.ts --apply  -- executes mutations
 *
 * Rules:
 * - Idempotent: safe to run multiple times
 * - No prisma db push
 * - No production secrets in this file
 * - Shows counts before mutations
 */

import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const isDryRun = !process.argv.includes('--apply');

function log(msg: string) {
  console.log(isDryRun ? `[DRY-RUN] ${msg}` : `[APPLY]   ${msg}`);
}

async function main() {
  console.log('');
  console.log('=== Phase 1.1 Business Unit & Site Domain Bootstrap ===');
  console.log(isDryRun ? '>>> DRY RUN MODE — no changes will be made. Pass --apply to execute.' : '>>> APPLY MODE — mutations will execute.');
  console.log('');

  // ─────────────────────────────────────────────────
  // 1. Business Units
  // ─────────────────────────────────────────────────
  const buPlans = [
    {
      code: 'COMPANY_SERVICES',
      name: 'TechInPedia Company Services',
      description: 'Core company services and software development',
    },
    {
      code: 'MARKETPLACE',
      name: 'Urban Marketplace',
      description: 'B2C Local Discovery + B2B Products/Suppliers marketplace',
    },
  ];

  log('Business Units to upsert:');
  buPlans.forEach(b => log(`  - ${b.code}: "${b.name}"`));

  let companyBU: any, marketplaceBU: any;
  if (!isDryRun) {
    companyBU = await db.businessUnit.upsert({
      where: { code: 'COMPANY_SERVICES' },
      update: { name: buPlans[0].name, isActive: true, isSystem: true },
      create: { code: 'COMPANY_SERVICES', name: buPlans[0].name, description: buPlans[0].description, isActive: true, isSystem: true },
    });
    marketplaceBU = await db.businessUnit.upsert({
      where: { code: 'MARKETPLACE' },
      update: { name: buPlans[1].name, isActive: true, isSystem: true },
      create: { code: 'MARKETPLACE', name: buPlans[1].name, description: buPlans[1].description, isActive: true, isSystem: true },
    });
    log(`  COMPANY_SERVICES id: ${companyBU.id}`);
    log(`  MARKETPLACE id:     ${marketplaceBU.id}`);
  } else {
    // Read existing for planning display
    companyBU = await db.businessUnit.findUnique({ where: { code: 'COMPANY_SERVICES' } });
    marketplaceBU = await db.businessUnit.findUnique({ where: { code: 'MARKETPLACE' } });
    log(`  COMPANY_SERVICES current id: ${companyBU?.id ?? 'NOT YET CREATED'}`);
    log(`  MARKETPLACE current id:      ${marketplaceBU?.id ?? 'NOT YET CREATED'}`);
  }

  console.log('');

  // ─────────────────────────────────────────────────
  // 2. Sites
  // ─────────────────────────────────────────────────
  const sitePlans = [
    {
      code: 'COMPANY_PUBLIC',
      name: 'Company Website',
      domain: 'techinpedia.com',
      type: 'PUBLIC_WEBSITE' as const,
      buCode: 'COMPANY_SERVICES',
    },
    {
      code: 'MARKETPLACE_PUBLIC',
      name: 'Urban Marketplace Portal',
      // NOTE: domain here is the current primary — Urban is domain-portable.
      // The canonical identity is siteCode=MARKETPLACE_PUBLIC + BU=MARKETPLACE,
      // NOT the domain. Domain changes are managed via SiteDomain table.
      domain: 'urban.techinpedia.com',
      type: 'MARKETPLACE' as const,
      buCode: 'MARKETPLACE',
    },
    {
      code: 'INTERNAL_PORTAL',
      name: 'Central Admin Portal',
      domain: 'admin.techinpedia.com',
      type: 'INTERNAL_PORTAL' as const,
      buCode: null, // cross-BU admin
    },
  ];

  log('Sites to upsert:');
  sitePlans.forEach(s => log(`  - ${s.code}: "${s.name}" (BU: ${s.buCode ?? 'cross-BU'})`));

  let companySite: any, marketplaceSite: any, internalSite: any;
  if (!isDryRun) {
    companySite = await db.site.upsert({
      where: { code: 'COMPANY_PUBLIC' },
      update: { name: 'Company Website', domain: 'techinpedia.com', businessUnitId: companyBU.id, isActive: true, isPrimary: true },
      create: { code: 'COMPANY_PUBLIC', name: 'Company Website', domain: 'techinpedia.com', type: 'PUBLIC_WEBSITE', businessUnitId: companyBU.id, isPrimary: true },
    });
    marketplaceSite = await db.site.upsert({
      where: { code: 'MARKETPLACE_PUBLIC' },
      update: { name: 'Urban Marketplace Portal', domain: 'urban.techinpedia.com', businessUnitId: marketplaceBU.id, isActive: true, isPrimary: true },
      create: { code: 'MARKETPLACE_PUBLIC', name: 'Urban Marketplace Portal', domain: 'urban.techinpedia.com', type: 'MARKETPLACE', businessUnitId: marketplaceBU.id, isPrimary: true },
    });
    internalSite = await db.site.upsert({
      where: { code: 'INTERNAL_PORTAL' },
      update: { name: 'Central Admin Portal', domain: 'admin.techinpedia.com', isActive: true, isPrimary: true },
      create: { code: 'INTERNAL_PORTAL', name: 'Central Admin Portal', domain: 'admin.techinpedia.com', type: 'INTERNAL_PORTAL', isPrimary: true },
    });
    log(`  COMPANY_PUBLIC id:      ${companySite.id}`);
    log(`  MARKETPLACE_PUBLIC id:  ${marketplaceSite.id}`);
    log(`  INTERNAL_PORTAL id:     ${internalSite.id}`);
  } else {
    companySite = await db.site.findUnique({ where: { code: 'COMPANY_PUBLIC' } });
    marketplaceSite = await db.site.findUnique({ where: { code: 'MARKETPLACE_PUBLIC' } });
    internalSite = await db.site.findUnique({ where: { code: 'INTERNAL_PORTAL' } });
    log(`  COMPANY_PUBLIC current id:     ${companySite?.id ?? 'NOT YET CREATED'}`);
    log(`  MARKETPLACE_PUBLIC current id: ${marketplaceSite?.id ?? 'NOT YET CREATED'}`);
    log(`  INTERNAL_PORTAL current id:    ${internalSite?.id ?? 'NOT YET CREATED'}`);
  }

  console.log('');

  // ─────────────────────────────────────────────────
  // 3. SiteDomains — Authoritative Hostname Registry
  //
  // URBAN DOMAIN PORTABILITY NOTE:
  // Urban's identity is MARKETPLACE_PUBLIC (siteCode) + MARKETPLACE (businessUnit).
  // The hostname is just a routing alias — NOT the permanent identity.
  // To change the Urban domain in future:
  //   1. Add new SiteDomain with isPrimary=true
  //   2. Mark old SiteDomain isPrimary=false (or isActive=false if retiring)
  //   3. Update DNS/SSL/deployment config
  //   4. NO marketplace data rebuild required
  // ─────────────────────────────────────────────────
  const siteDomainPlans = [
    // Company Website
    { hostname: 'techinpedia.com',       siteCode: 'COMPANY_PUBLIC',    isPrimary: true  },
    { hostname: 'www.techinpedia.com',   siteCode: 'COMPANY_PUBLIC',    isPrimary: false }, // alias

    // Urban Marketplace — current hostname (domain-portable, see note above)
    { hostname: 'urban.techinpedia.com', siteCode: 'MARKETPLACE_PUBLIC', isPrimary: true },

    // Central Admin Portal
    { hostname: 'admin.techinpedia.com', siteCode: 'INTERNAL_PORTAL',  isPrimary: true  },
  ];

  log('SiteDomains to upsert:');
  siteDomainPlans.forEach(d => log(`  - ${d.hostname} → ${d.siteCode} (primary: ${d.isPrimary})`));

  if (!isDryRun) {
    const siteByCode: Record<string, any> = {
      COMPANY_PUBLIC: companySite,
      MARKETPLACE_PUBLIC: marketplaceSite,
      INTERNAL_PORTAL: internalSite,
    };

    for (const plan of siteDomainPlans) {
      const site = siteByCode[plan.siteCode];
      if (!site) {
        console.warn(`  WARN: Site ${plan.siteCode} not found, skipping domain ${plan.hostname}`);
        continue;
      }
      await db.siteDomain.upsert({
        where: { hostname: plan.hostname },
        update: { siteId: site.id, isPrimary: plan.isPrimary, isActive: true },
        create: { hostname: plan.hostname, siteId: site.id, isPrimary: plan.isPrimary, isActive: true },
      });
      log(`  Registered: ${plan.hostname} → ${plan.siteCode}`);
    }
  }

  console.log('');

  // ─────────────────────────────────────────────────
  // 4. Backfill Historical Enquiries
  // ─────────────────────────────────────────────────
  const nullBUCount = await db.enquiry.count({ where: { businessUnitId: null } });
  log(`Historical enquiries with null businessUnitId: ${nullBUCount}`);

  if (nullBUCount > 0) {
    log(`Will backfill ${nullBUCount} enquiries → COMPANY_SERVICES`);
    if (!isDryRun) {
      const { count } = await db.enquiry.updateMany({
        where: { businessUnitId: null },
        data: {
          businessUnitId: companyBU.id,
          siteId: companySite.id,
        },
      });
      log(`Backfilled ${count} enquiries to COMPANY_SERVICES.`);
    }
  } else {
    log('No null-BU enquiries to backfill.');
  }

  console.log('');
  console.log(isDryRun
    ? '>>> DRY RUN COMPLETE. Review planned changes above, then run with --apply.'
    : '>>> APPLY COMPLETE. Phase 1.1 bootstrap done.');
  console.log('');
}

main()
  .catch((e) => {
    console.error('Backfill error:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
