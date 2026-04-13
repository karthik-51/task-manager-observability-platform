
const Joi = require("joi");

exports.taskSchema = Joi.object({
  title: Joi.string().min(2),

  description: Joi.string().allow(""),

  priority: Joi.string().valid("low", "medium", "high"),

  status: Joi.string().valid("todo", "inprogress", "completed"),

  dueDate: Joi.date(),

  completed: Joi.boolean()
});