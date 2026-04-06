const analyticsService = require("../services/analytics.service");
const logger = require("../config/logger");

exports.getAnalytics = async (req, res, next) => {
  try {
    logger.info("Analytics controller: request", { userId: req.user.id });
    const data = await analyticsService.getAnalytics(req.user.id);
    res.json(data);
  } catch (err) {
    logger.error("Analytics controller: failed", err);
    next(err);
  }
};
