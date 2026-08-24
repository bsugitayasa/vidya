const { z } = require('zod');

const submitKuesionerSchema = z.object({
  token: z.string().min(16, 'Link kuesioner tidak valid'),
  pesanKesan: z.string().trim().min(10, 'Pesan dan kesan minimal 10 karakter').max(2000, 'Pesan dan kesan maksimal 2000 karakter')
}).strict();

module.exports = { submitKuesionerSchema };
