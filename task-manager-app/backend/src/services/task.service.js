

const Task = require("../models/task.model");
const agenda = require("../config/agenda");
const logger = require("../config/logger");
const AppError = require("../utils/AppError");

exports.create = async (data, userId) => {
  logger.info("TaskService.create — started", { userId, title: data.title });
  const task = await Task.create({ ...data, user: userId });

  if (task.dueDate) {
    const job = await agenda.schedule(task.dueDate, "notify-overdue-task", { taskId: task._id });
    await Task.findByIdAndUpdate(task._id, { jobId: job.attrs._id });
    logger.info("TaskService.create — scheduled notification", { taskId: task._id, jobId: job.attrs._id });
  }

  logger.info("TaskService.create — success", { taskId: task._id });
  return task;
};

exports.getAll = async (query, userId) => {
  logger.info("TaskService.getAll — started", { userId, query });

  const { search, priority, status, completed, dueBefore, dueAfter } = query;

  const filter = {
    user: userId,
    ...(search && { title: { $regex: search, $options: "i" } }),
    ...(priority && { priority }),
    ...(status && { status }),
    ...(completed !== undefined && { completed: completed === "true" }),
    ...((dueBefore || dueAfter) && {
      dueDate: {
        ...(dueAfter && { $gte: new Date(dueAfter) }),
        ...(dueBefore && { $lte: new Date(dueBefore) }),
      },
    }),
  };

  const tasks = await Task.find(filter).sort({ createdAt: -1 });
  const total = tasks.length;

  logger.info("TaskService.getAll — success", { userId, total });
  return { total, tasks };
};

exports.update = async (taskId, data, userId) => {
  logger.info("TaskService.update — started", { taskId, userId });
  const task = await Task.findOne({ _id: taskId, user: userId });

  if (!task) {
    logger.warn("TaskService.update — task not found", { taskId, userId });
    throw new AppError("Task not found", 404);
  }

  if (data.completed === true && task.jobId) {
    await agenda.cancel({ _id: task.jobId });
    logger.info("TaskService.update — cancelled job (early completion)", { taskId, jobId: task.jobId });
  }

  if (data.dueDate && task.jobId) {
    await agenda.cancel({ _id: task.jobId });
    const job = await agenda.schedule(new Date(data.dueDate), "notify-overdue-task", { taskId: task._id });
    data.jobId = job.attrs._id;
    logger.info("TaskService.update — rescheduled notification", { taskId, jobId: job.attrs._id });
  }

  const updated = await Task.findByIdAndUpdate(taskId, data, { new: true });
  logger.info("TaskService.update — success", { taskId });
  return updated;
};

exports.remove = async (taskId, userId) => {
  logger.info("TaskService.remove — started", { taskId, userId });
  const task = await Task.findOneAndDelete({ _id: taskId, user: userId });

  if (!task) {
    logger.warn("TaskService.remove — task not found", { taskId, userId });
    throw new AppError("Task not found", 404);
  }

  if (task.jobId) {
    await agenda.cancel({ _id: task.jobId });
    logger.info("TaskService.remove — cancelled job", { taskId, jobId: task.jobId });
  }

  logger.info("TaskService.remove — success", { taskId });
  return task;
};
