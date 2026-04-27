const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const id = "PDPN-2026-0006";
    const parsedId = parseInt(id);
    console.log('Parsed ID:', parsedId);
    const sisya = await prisma.sisya.findUnique({
      where: { id: parsedId }
    });
    console.log('Sisya:', sisya);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
