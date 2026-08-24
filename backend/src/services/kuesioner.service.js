const crypto = require('crypto');

const TIME_ZONE = 'Asia/Makassar';
const PROMPT_VERSION = 'v1';

const getTodayKey = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const getDateRange = (dateKey = getTodayKey()) => ({
  gte: new Date(`${dateKey}T00:00:00.000Z`),
  lte: new Date(`${dateKey}T23:59:59.999Z`)
});

const getTokenSecret = () => process.env.KUESIONER_TOKEN_SECRET || process.env.JWT_SECRET || 'vidya-kuesioner-local';

const createSessionToken = (sessionId) => {
  const value = String(sessionId);
  const signature = crypto.createHmac('sha256', getTokenSecret()).update(value).digest('base64url');
  return `${value}.${signature}`;
};

const parseSessionToken = (token) => {
  const [value, signature] = String(token || '').split('.');
  if (!/^\d+$/.test(value) || !signature) return null;
  const expected = createSessionToken(value).split('.')[1];
  const suppliedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (suppliedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) return null;
  return Number(value);
};

const redactPersonalData = (text) => String(text)
  .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, '[EMAIL DIHAPUS]')
  .replace(/\b(?:\+?62|0)8\d{7,12}\b/g, '[NO HP DIHAPUS]')
  .replace(/\bPDPN-\d{4}-\d+\b/gi, '[NO PENDAFTARAN DIHAPUS]');

const sourceHash = (answers) => crypto.createHash('sha256')
  .update(answers.map((answer) => `${answer.id}:${answer.pesanKesan}`).join('\n'))
  .digest('hex');

const extractOutputText = (responseData) => {
  if (responseData.output_text) return responseData.output_text;
  for (const item of responseData.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && content.text) return content.text;
    }
  }
  return null;
};

module.exports = {
  TIME_ZONE,
  PROMPT_VERSION,
  getTodayKey,
  getDateRange,
  createSessionToken,
  parseSessionToken,
  redactPersonalData,
  sourceHash,
  extractOutputText
};
