const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const app = require('../src/app');

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } } });
  assert.ok(user, 'Diperlukan minimal satu Admin/Super Admin');
  assert.ok(process.env.JWT_SECRET, 'JWT_SECRET belum tersedia');
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    const base = `http://127.0.0.1:${server.address().port}/api/keuangan`;
    for (const endpoint of ['/dashboard', '/kategori', '/akun-kas', '/rab']) {
      const response = await fetch(`${base}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json();
      assert.equal(response.status, 200, `${endpoint}: ${body.message || response.statusText}`);
      assert.equal(body.success, true, `${endpoint} tidak mengembalikan success=true`);
    }
    console.log('Finance authenticated HTTP smoke test passed.');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().finally(() => prisma.$disconnect());
