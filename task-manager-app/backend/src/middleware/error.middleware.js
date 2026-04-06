const logger = require("../config/logger");

module.exports = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational || false;

  logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, {
    statusCode,
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message: isOperational ? err.message : "Internal Server Error",
  });
};
