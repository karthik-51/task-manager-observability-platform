const mongoose = require("mongoose");
const Task = require("../../src/models/task.model");

describe("Task Model", () => {

  const validUserId = new mongoose.Types.ObjectId();

  it("should create a valid task", async () => {
    const task = new Task({
      title: "Test Task",
      description: "Test Desc",
      user: validUserId
    });

    const saved = await task.save();

    expect(saved._id).toBeDefined();
    expect(saved.title).toBe("Test Task");
    expect(saved.priority).toBe("medium"); // default
    expect(saved.status).toBe("todo"); // default
    expect(saved.completed).toBe(false); // default
  });

  it("should fail without title", async () => {
    const task = new Task({
      user: validUserId
    });

    await expect(task.save()).rejects.toThrow();
  });

  it("should fail without user", async () => {
    const task = new Task({
      title: "No User Task"
    });

    await expect(task.save()).rejects.toThrow();
  });

  it("should fail with invalid priority", async () => {
    const task = new Task({
      title: "Invalid Priority",
      priority: "urgent",
      user: validUserId
    });

    await expect(task.save()).rejects.toThrow();
  });

  it("should fail with invalid status", async () => {
    const task = new Task({
      title: "Invalid Status",
      status: "done",
      user: validUserId
    });

    await expect(task.save()).rejects.toThrow();
  });

  it("should accept valid enums", async () => {
    const task = new Task({
      title: "Enum Test",
      priority: "high",
      status: "completed",
      user: validUserId
    });

    const saved = await task.save();

    expect(saved.priority).toBe("high");
    expect(saved.status).toBe("completed");
  });

  it("should store dueDate correctly", async () => {
    const date = new Date();

    const task = new Task({
      title: "Date Task",
      dueDate: date,
      user: validUserId
    });

    const saved = await task.save();

    expect(saved.dueDate).toEqual(date);
  });

});