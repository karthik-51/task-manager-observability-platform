
require("dotenv").config();
const app = require("./app");
const { connectDB } = require("./config/database");
const agenda = require("./config/agenda");
const logger = require("./config/logger");
require("./jobs/taskNotification.job");

process.on("uncaughtException", (err) => {
logger.error("Uncaught exception", err);
});

process.on("unhandledRejection", (reason) => {
logger.error("Unhandled rejection", reason);
});

const startServer = async () => {
try {
await connectDB();


agenda.on("ready", () => {
  agenda.start();
  logger.info("Agenda job scheduler started");
});

agenda.on("error", (err) => {
  logger.error("Agenda error", err);
});

app.listen(process.env.PORT || 5000, () =>
  logger.info(`Server running on port ${process.env.PORT || 5000}`)
);


} catch (err) {
logger.error("Failed to start server", err);
process.exit(1);
}
};

if (process.env.NODE_ENV !== "test") {
startServer();
}

module.exports = app;
