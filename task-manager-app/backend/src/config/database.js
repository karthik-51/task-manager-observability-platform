
const mongoose = require("mongoose");
const logger = require("./logger");

exports.connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    logger.info(`Establishing MongoDB connection to ${uri}`);
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info("MongoDB Connected");
  } catch (error) {
    logger.error("Database connection failed:", error);
    process.exit(1);
  }
};
