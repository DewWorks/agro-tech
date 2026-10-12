require('dotenv').config();
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const form = await prisma.generatedForm.findUnique({
    where: { id: '87a9f5a9-0c41-4f77-b05d-079e1a2f1be9' }
  });
  const p = form.payloadSnapshot;
  console.log('custeioAreaHa:', p.custeioAreaHa, 'custeioCostPerHa:', p.custeioCostPerHa);
}

main().finally(() => {
  prisma.$disconnect();
  pool.end();
});
