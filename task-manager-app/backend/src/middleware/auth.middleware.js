
const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError");

exports.auth = (req, res, next) => {

  const header = req.headers.authorization;

  if (!header) {
    return next(new AppError("Authorization token missing", 401));
  }

  const token = header.split(" ")[1];

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();

  } catch {

    next(new AppError("Invalid or expired token", 401));

  }

};