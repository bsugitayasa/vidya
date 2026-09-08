const test = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_CLAUSES } = require('../src/controllers/paktaIntegritas.controller');

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
