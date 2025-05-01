const { errorResponse } = require('../utils/apiResponse');

// Fungsi factory yang mengembalikan middleware validasi
const validateRequest = (schema) => {
  return (req, res, next) => {
    // Validasi body, params, dan query (sesuaikan kebutuhan)
    const { error: bodyError } = schema.body ? schema.body.validate(req.body) : { error: null };
    const { error: paramsError } = schema.params ? schema.params.validate(req.params) : { error: null };
    const { error: queryError } = schema.query ? schema.query.validate(req.query) : { error: null };

    const error = bodyError || paramsError || queryError;

    if (error) {
      // Ambil detail error pertama
      const errorMessage = error.details[0].message.replace(/['"]/g, ''); // Hapus kutip
      return errorResponse(res, `Validation Error: ${errorMessage}`, 400);
    }

    next(); // Validasi sukses, lanjutkan
  };
};

module.exports = validateRequest;
