const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/user.model");
const logger = require("../config/logger");
const AppError = require("../utils/AppError");

const generateAccess = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_EXPIRE }
  );

const generateRefresh = (user) =>
  jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_EXPIRE }
  );

exports.register = async (data) => {
  logger.info("AuthService.register — started", { email: data.email });

  const existing = await User.findOne({ email: data.email });
  if (existing) {
    logger.warn("AuthService.register — email already registered", { email: data.email });
    throw new AppError("Email already registered", 409);
  }

  const user = await User.create(data);
  logger.info("AuthService.register — success", { userId: user._id });
  return user;
};

exports.login = async (email, password) => {
  logger.info("AuthService.login — started", { email });

  const user = await User.findOne({ email });
  if (!user) {
    logger.warn("AuthService.login — user not found", { email });
    throw new AppError("Invalid credentials", 401);
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    logger.warn("AuthService.login — wrong password", { email });
    throw new AppError("Invalid credentials", 401);
  }

  const accessToken = generateAccess(user);
  const refreshToken = generateRefresh(user);
  user.refreshToken = refreshToken;
  await user.save();

  logger.info("AuthService.login — success", { userId: user._id });
  return {
    accessToken,
    refreshToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

exports.refresh = async (token) => {
  logger.info("AuthService.refresh — started");

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    logger.warn("AuthService.refresh — invalid/expired token", { error: err.message });
    throw new AppError("Invalid or expired refresh token", 401);
  }

  const user = await User.findById(payload.id);
  if (!user || user.refreshToken !== token) {
    logger.warn("AuthService.refresh — token mismatch or user not found", { userId: payload.id });
    throw new AppError("Invalid refresh token", 401);
  }

  const accessToken = generateAccess(user);
  logger.info("AuthService.refresh — success", { userId: user._id });
  return {
    accessToken,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

exports.forgotPassword = async (email) => {
  logger.info("AuthService.forgotPassword — started", { email });

  const user = await User.findOne({ email });
  if (!user) {
    logger.warn("AuthService.forgotPassword — user not found", { email });
    throw new AppError("No account found with that email", 404);
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
  await user.save();

  logger.info("AuthService.forgotPassword — token generated", { email });
  return { token: resetToken };
};

exports.resetPassword = async (token, password) => {
  logger.info("AuthService.resetPassword — started");

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    logger.warn("AuthService.resetPassword — invalid or expired token");
    throw new AppError("Reset link is invalid or has expired", 400);
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  logger.info("AuthService.resetPassword — success", { userId: user._id });
  return { message: "Password updated successfully" };
};
