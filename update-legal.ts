import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const privacyPolicy = `
<section class="space-y-4 text-sm leading-relaxed">
  <h2 class="text-xl font-bold text-white">1. Introduction</h2>
  <p>Welcome to <strong>E Digital Media Solutions</strong>. We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website or use our digital media, marketing, and development services.</p>
</section>

<section class="space-y-4 text-sm leading-relaxed mt-6">
  <h2 class="text-xl font-bold text-white">2. Information We Collect</h2>
  <p>We may collect personal identification information including, but not limited to, your name, email address, phone number, company details, and project requirements when you interact with our services, request a quote, or contact our support team.</p>
</section>

<section class="space-y-4 text-sm leading-relaxed mt-6">
  <h2 class="text-xl font-bold text-white">3. How We Use Your Information</h2>
  <p>The information we collect is used to:</p>
  <ul class="list-disc pl-5 space-y-2">
    <li>Provide, operate, and maintain our digital media services.</li>
    <li>Improve, personalize, and expand our offerings.</li>
    <li>Communicate with you regarding updates, offers, and project progress.</li>
    <li>Process transactions and send related information including invoices and receipts.</li>
  </ul>
</section>

<section class="space-y-4 text-sm leading-relaxed mt-6">
  <h2 class="text-xl font-bold text-white">4. Data Security</h2>
  <p>We implement appropriate technical and organizational security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. However, please be aware that no method of transmission over the internet is 100% secure.</p>
</section>

<section class="space-y-4 text-sm leading-relaxed mt-6">
  <h2 class="text-xl font-bold text-white">5. Contact Us</h2>
  <p>If you have any questions or concerns about this Privacy Policy, please contact us at:</p>
  <div class="p-4 bg-slate-900 rounded-lg mt-2 border border-slate-800">
    <p><strong>Company:</strong> E Digital Media Solutions</p>
    <p><strong>Registered Office:</strong> SHOP NO B- 12 M-5, GUPTA PLAZA LSC BLK M, VIKAS PURI West Delhi, VIKAS PURI, New Delhi, 110018, West-Delhi</p>
    <p><strong>Phone:</strong> +91 98187 68680</p>
    <p><strong>Email:</strong> <a href="mailto:Support@techinpedia.com" class="text-blue-400 hover:underline">Support@techinpedia.com</a></p>
  </div>
</section>
`;

const termsOfService = `
<section class="space-y-4 text-sm leading-relaxed">
  <h2 class="text-xl font-bold text-white">1. Acceptance of Terms</h2>
  <p>By accessing or using the services provided by <strong>E Digital Media Solutions</strong>, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not access our services.</p>
</section>

<section class="space-y-4 text-sm leading-relaxed mt-6">
  <h2 class="text-xl font-bold text-white">2. Description of Services</h2>
  <p>E Digital Media Solutions offers a comprehensive suite of digital services including, but not limited to, software development, web design, digital marketing, SEO, and social media management.</p>
</section>

<section class="space-y-4 text-sm leading-relaxed mt-6">
  <h2 class="text-xl font-bold text-white">3. Intellectual Property Rights</h2>
  <p>Unless otherwise stated in a specific Statement of Work (SOW), E Digital Media Solutions retains all intellectual property rights to the preliminary designs, concepts, and codebase until full and final payment is received. Upon final payment, the rights to the final deliverables are transferred to the client.</p>
</section>

<section class="space-y-4 text-sm leading-relaxed mt-6">
  <h2 class="text-xl font-bold text-white">4. Payment & Billing</h2>
  <p>Clients agree to pay all fees and charges associated with their account on a timely basis. We reserve the right to suspend or terminate services for accounts that are past due.</p>
</section>

<section class="space-y-4 text-sm leading-relaxed mt-6">
  <h2 class="text-xl font-bold text-white">5. Limitation of Liability</h2>
  <p>In no event shall E Digital Media Solutions be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of our services.</p>
</section>

<section class="space-y-4 text-sm leading-relaxed mt-6">
  <h2 class="text-xl font-bold text-white">6. Contact Information</h2>
  <p>For any queries regarding these Terms, please contact us:</p>
  <div class="p-4 bg-slate-900 rounded-lg mt-2 border border-slate-800">
    <p><strong>Company:</strong> E Digital Media Solutions</p>
    <p><strong>Registered Office:</strong> SHOP NO B- 12 M-5, GUPTA PLAZA LSC BLK M, VIKAS PURI West Delhi, VIKAS PURI, New Delhi, 110018, West-Delhi</p>
    <p><strong>Phone:</strong> +91 98187 68680</p>
    <p><strong>Email:</strong> <a href="mailto:Support@techinpedia.com" class="text-blue-400 hover:underline">Support@techinpedia.com</a></p>
  </div>
</section>
`;

async function main() {
  await prisma.setting.upsert({
    where: { key: 'LEGAL_PRIVACY_POLICY' },
    update: { value: privacyPolicy, category: 'COMPANY' },
    create: { key: 'LEGAL_PRIVACY_POLICY', value: privacyPolicy, category: 'COMPANY' },
  });

  await prisma.setting.upsert({
    where: { key: 'LEGAL_TERMS_OF_SERVICE' },
    update: { value: termsOfService, category: 'COMPANY' },
    create: { key: 'LEGAL_TERMS_OF_SERVICE', value: termsOfService, category: 'COMPANY' },
  });

  console.log('Legal settings updated successfully in database!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
