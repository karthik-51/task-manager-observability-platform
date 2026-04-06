const router = require("express").Router();
const { auth } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const { taskSchema } = require("../validations/task.validation");
const controller = require("../controllers/task.controller");
const analyticsController = require("../controllers/analytics.controller");

router.use(auth);

router.post("/", validate(taskSchema), controller.create);

router.get("/", controller.getAll);

router.get("/analytics", analyticsController.getAnalytics);

router.put("/:id", controller.update);

router.delete("/:id", controller.delete);

module.exports = router;
