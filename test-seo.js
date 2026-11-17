const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const page = await prisma.seoLandingPage.findFirst({where: {status: 'PUBLISHED'}});
  console.log(page);
}
main().catch(console.error).finally(() => prisma.$disconnect());
