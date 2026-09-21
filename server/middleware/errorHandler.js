function errorHandler(error, req, res, next) {
  console.error(error);

  // SQL Server unique constraint violation for PhoneNumber.
  if (error.number === 2627 || error.number === 2601) {
    return res.status(409).json({ message: 'Phone number already exists.' });
  }

  const status = Number.isInteger(error.statusCode) ? error.statusCode : 500;
  res.status(status).json({
    message: status === 500 ? 'Internal server error.' : error.message
  });
}

module.exports = { errorHandler };
