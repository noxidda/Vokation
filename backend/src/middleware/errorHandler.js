export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: true,
      message: err.message,
      statusCode: 400,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      error: true,
      message: 'Duplicate entry found',
      statusCode: 409,
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    error: true,
    message: err.message || 'Internal server error',
    statusCode: err.statusCode || 500,
  });
};