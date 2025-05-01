const successResponse = (res, message, data = null, statusCode = 200) => {
    const response = {
      success: true,
      message: message,
    };
    if (data) {
      response.data = data;
    }
    return res.status(statusCode).json(response);
  };
  
  const errorResponse = (res, message, statusCode = 500, errors = null) => {
    const response = {
      success: false,
      message: message,
    };
    if (errors) {
      response.errors = errors;
    }
    // Log error di server (bisa ditambahkan logger yang lebih baik)
    console.error(`Error ${statusCode}: ${message}`, errors || '');
    return res.status(statusCode).json(response);
  };
  
  module.exports = {
    successResponse,
    errorResponse,
  };