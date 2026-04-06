const router = require("express").Router();
const controller = require("../controllers/auth.controller");
const validate = require("../middleware/validate.middleware");
const {
  registerSchema,
  loginSchema
} = require("../validations/auth.validation");

router.post("/register", validate(registerSchema), controller.register);
router.post("/login", validate(loginSchema), controller.login);
router.post("/refresh", controller.refresh);
router.post("/forgot-password", controller.forgotPassword);

router.post("/reset-password/:token", controller.resetPassword);

module.exports = router;