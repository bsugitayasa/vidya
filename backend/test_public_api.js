const axios = require('axios');

async function testCari() {
  try {
    console.log('Testing GET /api/sisya/cari?nomor=YF-2026-0001...');
    const response = await axios.get('http://localhost:3001/api/sisya/cari?nomor=YF-2026-0001');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response ? error.response.status : error.message);
    if (error.response) console.error('Error Data:', error.response.data);
  }
}

testCari();
