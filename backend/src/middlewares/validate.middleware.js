/**
 * Middleware untuk memvalidasi request body menggunakan Zod
 * @param {import('zod').ZodSchema} schema 
 */
const validate = (schema) => (req, res, next) => {
  try {
    // Validasi body
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Data tidak valid',
        details: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
    next(error);
  }
};

module.exports = validate;
