const fs = require('fs');
const bcrypt = require('bcryptjs');

async function generateSQL() {
  const hash = await bcrypt.hash('Admin@123456', 10);
  let sql = [];

  // Super admin
  sql.push(`INSERT INTO \`User\` (\`id\`, \`name\`, \`email\`, \`password\`, \`role\`, \`status\`, \`mustChangePassword\`, \`createdAt\`, \`updatedAt\`) VALUES
('super-admin-01', 'TechInPedia Admin', 'admin@techinpedia.in', '${hash}', 'SUPER_ADMIN', 'ACTIVE', 0, NOW(3), NOW(3))
ON DUPLICATE KEY UPDATE \`password\` = VALUES(\`password\`);`);

  // Settings
  const defaultSettings = [
    { key: 'company_name', value: 'TechInPedia India', category: 'COMPANY' },
    { key: 'company_tagline', value: 'We Build Digital Products That Move Businesses Forward', category: 'COMPANY' },
    { key: 'company_email', value: 'contact@techinpedia.in', category: 'COMPANY' },
    { key: 'company_phone', value: '+91 98765 43210', category: 'COMPANY' },
    { key: 'whatsapp_number', value: '919876543210', category: 'COMPANY' },
    { key: 'company_address', value: 'Cyber City, Tech Hub, Bengaluru, Karnataka, India', category: 'COMPANY' },
    { key: 'company_about', value: 'TechInPedia India is a high-performance digital product and software engineering agency delivering web applications, mobile solutions, custom SaaS, and enterprise software to global clients.', category: 'COMPANY' },
    { key: 'social_linkedin', value: 'https://linkedin.com/company/techinpedia-india', category: 'SOCIAL' },
    { key: 'social_github', value: 'https://github.com/techinpedia', category: 'SOCIAL' },
    { key: 'social_twitter', value: 'https://x.com/techinpedia', category: 'SOCIAL' },
    { key: 'social_instagram', value: 'https://www.instagram.com/techlynk.in/', category: 'SOCIAL' },
    { key: 'seo_default_title', value: 'TechInPedia India | Software Development & Digital Solutions Agency', category: 'SEO' },
    { key: 'seo_default_description', value: 'TechInPedia India builds custom web apps, mobile apps, SaaS platforms, and enterprise solutions. Websites & Apps That Grow Businesses.', category: 'SEO' },
    { key: 'seo_og_image', value: '/images/og-techinpedia.jpg', category: 'SEO' },
    { key: 'google_analytics_id', value: '', category: 'SEO' },
    { key: 'website_logo_text', value: 'TechInPedia', category: 'WEBSITE' },
    { key: 'website_footer_text', value: '© 2026 TechInPedia India. All rights reserved. Building scalable software solutions.', category: 'WEBSITE' },
  ];

  for (const s of defaultSettings) {
    const val = s.value.replace(/'/g, "\\'");
    sql.push(`INSERT INTO \`Setting\` (\`id\`, \`key\`, \`value\`, \`category\`, \`updatedAt\`) VALUES
(UUID(), '${s.key}', '${val}', '${s.category}', NOW(3))
ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), \`category\` = VALUES(\`category\`), \`updatedAt\` = NOW(3);`);
  }

  fs.writeFileSync('seed_base.sql', sql.join('\n\n'));
  console.log('✅ Generated seed_base.sql');
}

generateSQL();
