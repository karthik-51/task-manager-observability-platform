const Joi = require("joi");

exports.registerSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/[A-Z]/, "uppercase")
    .pattern(/[a-z]/, "lowercase")
    .pattern(/[0-9]/, "number")
    .pattern(/[^A-Za-z0-9]/, "special character")
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters",
      "string.pattern.name": "Password must contain at least one {#name}",
    }),
});

exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
