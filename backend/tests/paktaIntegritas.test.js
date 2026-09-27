const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_CLAUSES, validateSignaturePayload } = require('../src/controllers/paktaIntegritas.controller');

test('klausul bawaan pakta memiliki id unik dan isi lengkap', () => {
  assert.ok(DEFAULT_CLAUSES.length >= 8);
  assert.equal(new Set(DEFAULT_CLAUSES.map((item) => item.id)).size, DEFAULT_CLAUSES.length);
  DEFAULT_CLAUSES.forEach((item) => {
    assert.ok(item.title.length > 2);
    assert.ok(item.text.length > 20);
  });
});

test('pakta melindungi materi ajah dari komersialisasi, distribusi, dan penggandaan', () => {
  const content = DEFAULT_CLAUSES.map((item) => item.text.toLowerCase()).join(' ');
  ['menjual', 'mengedarkan', 'memberikan', 'menggandakan'].forEach((word) => assert.match(content, new RegExp(word)));
});

test('validasi tanda tangan admin memakai persetujuan yang sama dengan portal sisya', () => {
  const item = {
    sisya: { namaLengkap: 'I Made Dharma' },
    contentSnapshot: { klausul: [{ id: 'satu' }, { id: 'dua' }] }
  };
  const valid = validateSignaturePayload(item, {
    namaPenandatangan: 'I Made Dharma',
    acceptedClauseIds: ['satu', 'dua'],
    readAgreement: true,
    signatureData: 'data:image/png;base64,AA=='
  });
  assert.equal(valid.error, undefined);
  assert.equal(valid.name, 'I Made Dharma');

  assert.match(validateSignaturePayload(item, {
    namaPenandatangan: 'I Made Dharma',
    acceptedClauseIds: ['satu'],
    readAgreement: true,
    signatureData: 'data:image/png;base64,AA=='
  }).error, /Seluruh pernyataan/);
});
