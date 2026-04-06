const authService = require("../services/auth.service");
const logger = require("../config/logger");
const AppError = require("../utils/AppError");

exports.register = async (req, res, next) => {
  logger.info("AuthController.register — started", { email: req.body.email });
  try {
    const user = await authService.register(req.body);
    logger.info("AuthController.register — success", { userId: user._id });
    res.status(201).json({ success: true, message: "User registered successfully", userId: user._id });
  } catch (err) {
    logger.error("AuthController.register — failed", { error: err.message });
    next(err);
  }
};

exports.login = async (req, res, next) => {
  logger.info("AuthController.login — started", { email: req.body.email });
  try {
    const result = await authService.login(req.body.email, req.body.password);
    logger.info("AuthController.login — success", { userId: result.user.id });
    res.json({
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: { name: result.user.name, email: result.user.email },
    });
  } catch (err) {
    logger.error("AuthController.login — failed", { error: err.message });
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  logger.info("AuthController.refresh — started");
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError("Refresh token missing", 401);
    const tokens = await authService.refresh(refreshToken);
    logger.info("AuthController.refresh — success");
    res.json(tokens);
  } catch (err) {
    logger.error("AuthController.refresh — failed", { error: err.message });
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  logger.info("AuthController.forgotPassword — started", { email: req.body.email });
  try {
    const result = await authService.forgotPassword(req.body.email);
    logger.info("AuthController.forgotPassword — success", { email: req.body.email });
    res.json({ success: true, token: result.token });
  } catch (err) {
    logger.error("AuthController.forgotPassword — failed", { error: err.message });
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  logger.info("AuthController.resetPassword — started");
  try {
    const { token } = req.params;
    const { password } = req.body;
    if (!password) throw new AppError("Password required", 400);
    const result = await authService.resetPassword(token, password);
    logger.info("AuthController.resetPassword — success");
    res.json({ success: true, message: result.message });
  } catch (err) {
    logger.error("AuthController.resetPassword — failed", { error: err.message });
    next(err);
  }
};
