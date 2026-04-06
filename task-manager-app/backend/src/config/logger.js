const { createLogger, format, transports } = require("winston");

module.exports = createLogger({
  level: "info",

  format: format.combine(
    format.errors({ stack: true }),
    format.timestamp(),
    format.json()
  ),

  defaultMeta: {
    service: "task-manager-backend",
    environment: process.env.NODE_ENV || "production"
  },

  transports: [
    new transports.Console(),

    new transports.File({
      filename: "logs/combined.log",
      level: "info"
    }),

    new transports.File({
      filename: "logs/error.log",
      level: "error"
    })
  ]
});
