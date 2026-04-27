const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:3001/api';
let token = '';
let sisyaId = null;
let nomorPendaftaran = '';

async function run() {
  try {
    console.log('--- 1. Login as Admin ---');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@yayasan.com',
      password: 'admin123'
    });
    token = loginRes.data.data.token;
    console.log('Logged in.');

    console.log('\n--- 2. Register new Sisya ---');
    // We need to send multipart/form-data for registration
    // For simplicity in this script, we'll assume we can use the API directly or mocked data
    // But registration requires a program ID. Let's find one.
    const programsRes = await axios.get(`${API_URL}/program-ajahan`);
    const programId = programsRes.data.data[0].id; // Kawikon usually
    console.log(`Using program ID: ${programId}`);

    const registerData = {
      namaLengkap: 'Test Verification ' + Date.now(),
      tempatLahir: 'Denpasar',
      tanggalLahir: '1990-01-01',
      jenisKelamin: 'LAKI_LAKI',
      alamat: 'Jl. Test No. 1',
      noHp: '08123456789',
      namaGriya: 'Griya Test',
      namaDesa: 'Desa Test',
      programs: JSON.stringify([{ id: programId, isPasangan: false }])
    };

    const regRes = await axios.post(`${API_URL}/sisya/register`, registerData);
    nomorPendaftaran = regRes.data.data.nomorPendaftaran;
    console.log(`Registered. Nomor: ${nomorPendaftaran}`);

    console.log('\n--- 3. Check Status (Public) ---');
    const statusRes = await axios.get(`${API_URL}/sisya/cari?nomor=${nomorPendaftaran}`);
    sisyaId = statusRes.data.data.id;
    console.log(`Status: ${statusRes.data.data.statusPembayaran} (Expected: MENUNGGU_PEMBAYARAN)`);

    console.log('\n--- 4. Upload 1st Installment (Rp 400,000) ---');
    // Mocking file upload is hard with axios without form-data and a real file
    // So we'll skip the real upload and just manually create a payment record if possible
    // or just assume the controller works.
    // Actually, let's try to use the actual endpoint with a dummy file.
    const dummyFile = path.join(__dirname, 'dummy.jpg');
    // fs.writeFileSync(dummyFile, 'fake jpg content');
    
    const FormData = require('form-data');
    const form1 = new FormData();
    form1.append('filePunia', fs.createReadStream(dummyFile));
    form1.append('keterangan', 'Cicilan 1');

    await axios.post(`${API_URL}/sisya/${sisyaId}/upload-punia`, form1, {
      headers: form1.getHeaders()
    });
    console.log('1st Installment uploaded.');

    console.log('\n--- 5. Verify 1st Installment as Admin ---');
    // Get payment ID
    const sisyaDetail = await axios.get(`${API_URL}/sisya/${sisyaId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const paymentId = sisyaDetail.data.data.pembayarans[0].id;
    
    await axios.patch(`${API_URL}/pembayaran/${paymentId}/verifikasi`, {
      nominal: 400000,
      status: 'VERIFIKASI',
      keterangan: 'Verifikasi Cicilan 1'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('1st Installment verified.');

    const statusAfter1 = await axios.get(`${API_URL}/sisya/cari?nomor=${nomorPendaftaran}`);
    console.log(`Status now: ${statusAfter1.data.data.statusPembayaran} (Expected: BELUM_LUNAS)`);

    console.log('\n--- 6. Upload 2nd Installment (Rp 600,000) ---');
    const form2 = new FormData();
    form2.append('filePunia', fs.createReadStream(dummyFile));
    form2.append('keterangan', 'Cicilan 2 (Pelunasan)');

    await axios.post(`${API_URL}/sisya/${sisyaId}/upload-punia`, form2, {
      headers: form2.getHeaders()
    });
    console.log('2nd Installment uploaded.');

    console.log('\n--- 7. Verify 2nd Installment as Admin ---');
    const sisyaDetail2 = await axios.get(`${API_URL}/sisya/${sisyaId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const paymentId2 = sisyaDetail2.data.data.pembayarans.find(p => p.status === 'MENUNGGU').id;
    
    await axios.patch(`${API_URL}/pembayaran/${paymentId2}/verifikasi`, {
      nominal: 600000,
      status: 'VERIFIKASI',
      keterangan: 'Verifikasi Cicilan 2'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('2nd Installment verified.');

    const finalStatus = await axios.get(`${API_URL}/sisya/cari?nomor=${nomorPendaftaran}`);
    console.log(`Final Status: ${finalStatus.data.data.statusPembayaran} (Expected: LUNAS)`);

    if (finalStatus.data.data.statusPembayaran === 'LUNAS') {
      console.log('\nSUCCESS: Installment logic works correctly!');
    } else {
      console.log('\nFAILURE: Installment logic failed.');
    }

  } catch (err) {
    console.error('\nERROR:', err.response?.data || err.message);
  } finally {
    if (fs.existsSync(path.join(__dirname, 'dummy.txt'))) fs.unlinkSync(path.join(__dirname, 'dummy.txt'));
  }
}

run();
