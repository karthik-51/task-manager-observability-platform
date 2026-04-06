const agenda = require("../config/agenda");
const Task = require("../models/task.model");
const User = require("../models/user.model");
const mailService = require("../services/mail.service");

const logger = require("../config/logger");

agenda.define("notify-overdue-task", async (job) => {
  const { taskId } = job.attrs.data;
  logger.info("Job notify-overdue-task started", { taskId, jobId: job.attrs._id });

  try {
    const task = await Task.findById(taskId);

    // Task was completed before deadline or deleted — nothing to do
    if (!task || task.completed) {
      logger.info("Job notify-overdue-task skipping, task missing or completed", { taskId });
      return;
    }

    const user = await User.findById(task.user);
    if (!user) {
      logger.warn("Job notify-overdue-task cannot find user", { taskId, userId: task.user });
      return;
    }

    await mailService.sendOverdueEmail(user.email, user.name, task.title);
    logger.info("Job notify-overdue-task email sent", { taskId, userId: user._id });
  } catch (err) {
    logger.error("Job notify-overdue-task failed", err);
    throw err;
  }
});
//  agenda.on("success:notify-overdue-task", (job) => {
//     job.remove();
//   });
