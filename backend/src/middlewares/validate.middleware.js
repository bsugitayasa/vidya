/**
 * Middleware untuk memvalidasi request body menggunakan Zod
 * @param {import('zod').ZodSchema} schema 
 */
const validate = (schema) => (req, res, next) => {
  try {
    // Validasi body dan replace dengan data yang sudah dicoerce/transform
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    const validationIssues = error.issues || error.errors;
    if (error.name === 'ZodError' || validationIssues) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Data tidak valid',
        details: (validationIssues || []).map(err => ({
          path: err.path ? err.path.join('.') : '',
          message: err.message
        }))
      });
    }
    next(error);
  }
};

module.exports = validate;
