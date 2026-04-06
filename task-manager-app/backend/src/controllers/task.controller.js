const taskService = require("../services/task.service");
const logger = require("../config/logger");

exports.create = async (req, res, next) => {
  try {
    logger.info("Task controller: create request", { userId: req.user.id, body: req.body });
    const task = await taskService.create(req.body, req.user.id);
    logger.info("Task created", { taskId: task._id });
    res.status(201).json(task);
  } catch (err) {
    logger.error("Task controller: create failed", err);
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  try {
    logger.info("Task controller: getAll request", { userId: req.user.id, query: req.query });
    const result = await taskService.getAll(req.query, req.user.id);
    res.json(result);
  } catch (err) {
    logger.error("Task controller: getAll failed", err);
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    logger.info("Task controller: update request", { taskId: req.params.id, userId: req.user.id, body: req.body });
    const task = await taskService.update(req.params.id, req.body, req.user.id);
    res.json(task);
  } catch (err) {
    logger.error("Task controller: update failed", err);
    next(err);
  }
};

exports.delete = async (req, res, next) => {
  try {
    logger.info("Task controller: delete request", { taskId: req.params.id, userId: req.user.id });
    await taskService.remove(req.params.id, req.user.id);
    logger.info("Task deleted", { taskId: req.params.id });
    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    logger.error("Task controller: delete failed", err);
    next(err);
  }
};