const mongoose = require("mongoose");

module.exports = mongoose.model(
  "Task",
  new mongoose.Schema(
    {
      title: { type: String, required: true },

      description: String,

      priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
      },

      status: {
        type: String,
        enum: ["todo", "inprogress", "completed"],
        default: "todo",
      },

      dueDate: {
        type: Date,
      },

      completed: {
        type: Boolean,
        default: false,
      },

      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      jobId: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    { timestamps: true }
  )
);