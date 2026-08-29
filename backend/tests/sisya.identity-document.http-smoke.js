const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');
const app = require('../src/app');

async function main() {
  assert.ok(process.env.JWT_SECRET, 'JWT_SECRET belum tersedia');
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));

  try {
    const base = `http://127.0.0.1:${server.address().port}/api/sisya/2147483647`;
    const makeToken = (role) => jwt.sign({ id: 1, email: 'smoke@test.local', role }, process.env.JWT_SECRET, { expiresIn: '5m' });

    for (const endpoint of ['dokumen-identitas', 'surat-rekomendasi']) {
      const adminResponse = await fetch(`${base}/${endpoint}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${makeToken('ADMIN')}` }
      });
      assert.equal(adminResponse.status, 403, `Role ADMIN seharusnya ditolak untuk ${endpoint}`);

      const superAdminResponse = await fetch(`${base}/${endpoint}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${makeToken('SUPER_ADMIN')}` }
      });
      assert.equal(superAdminResponse.status, 404, `SUPER_ADMIN seharusnya lolos otorisasi untuk ${endpoint}`);
    }

    const reportResponse = await fetch(`http://127.0.0.1:${server.address().port}/api/laporan/export`, {
      headers: { Authorization: `Bearer ${makeToken('ADMIN')}` }
    });
    assert.equal(reportResponse.status, 200, 'Export laporan pendaftaran seharusnya berhasil');

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await reportResponse.arrayBuffer());
    for (const worksheet of workbook.worksheets) {
      const headers = worksheet.getRow(1).values;
      const identityColumn = headers.indexOf('File KTP/KK/Ijazah');
      const recommendationColumn = headers.indexOf('File Surat Rekomendasi');
      assert.ok(identityColumn > 0, `Kolom KTP/KK/Ijazah tidak ditemukan pada sheet ${worksheet.name}`);
      assert.ok(recommendationColumn > 0, `Kolom Surat Rekomendasi tidak ditemukan pada sheet ${worksheet.name}`);
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        assert.ok(row.getCell(identityColumn).value, `Status KTP kosong pada sheet ${worksheet.name} baris ${rowNumber}`);
        assert.ok(row.getCell(recommendationColumn).value, `Status Surat Rekomendasi kosong pada sheet ${worksheet.name} baris ${rowNumber}`);
      });
    }

    console.log('Registration document authorization and export smoke test passed.');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main();
