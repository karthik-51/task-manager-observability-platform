const taskService = require("../../src/services/task.service");
const Task = require("../../src/models/task.model");
const agenda = require("../../src/config/agenda");

jest.mock("../../src/models/task.model");
jest.mock("../../src/config/agenda");

describe("Task Service", () => {
  beforeEach(() => jest.clearAllMocks());

  // ================= CREATE =================

  it("should create task without due date", async () => {
    Task.create.mockResolvedValue({ _id: "1" });

    const res = await taskService.create({ title: "t" }, "user1");

    expect(res._id).toBe("1");
    expect(agenda.schedule).not.toHaveBeenCalled(); // 🔥 branch
  });

  it("should create task with due date (schedule job)", async () => {
    const mockTask = { _id: "1", dueDate: new Date() };

    Task.create.mockResolvedValue(mockTask);
    agenda.schedule.mockResolvedValue({ attrs: { _id: "job1" } });
    Task.findByIdAndUpdate.mockResolvedValue();

    await taskService.create({ dueDate: new Date() }, "user1");

    expect(agenda.schedule).toHaveBeenCalled();
    expect(Task.findByIdAndUpdate).toHaveBeenCalled();
  });

  // ================= GET ALL =================

  it("should get all tasks (no filters)", async () => {
    Task.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([{ id: 1 }]),
    });

    const res = await taskService.getAll({}, "user1");

    expect(res.total).toBe(1);
  });

  it("should apply filters correctly", async () => {
    Task.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([]),
    });

    await taskService.getAll(
      {
        search: "test",
        priority: "high",
        status: "open",
        completed: "true",
        dueBefore: new Date(),
        dueAfter: new Date(),
      },
      "user1"
    );

    expect(Task.find).toHaveBeenCalled(); // ensures filter branch hit
  });

  // ================= UPDATE =================

  it("should update task normally", async () => {
    Task.findOne.mockResolvedValue({ jobId: null });
    Task.findByIdAndUpdate.mockResolvedValue({ updated: true });

    const res = await taskService.update("1", {}, "user1");

    expect(res).toBeDefined();
  });

  it("should fail update if task not found", async () => {
    Task.findOne.mockResolvedValue(null);

    await expect(taskService.update("1", {}, "user1"))
      .rejects.toThrow("Task not found");
  });

  it("should cancel job if task marked completed", async () => {
    Task.findOne.mockResolvedValue({ jobId: "job1" });

    Task.findByIdAndUpdate.mockResolvedValue({});

    await taskService.update(
      "1",
      { completed: true },
      "user1"
    );

    expect(agenda.cancel).toHaveBeenCalledWith({ _id: "job1" }); // 🔥 branch
  });

  it("should reschedule job if dueDate updated", async () => {
    Task.findOne.mockResolvedValue({ _id: "1", jobId: "job1" });

    agenda.cancel.mockResolvedValue();
    agenda.schedule.mockResolvedValue({ attrs: { _id: "job2" } });

    Task.findByIdAndUpdate.mockResolvedValue({});

    await taskService.update(
      "1",
      { dueDate: new Date() },
      "user1"
    );

    expect(agenda.cancel).toHaveBeenCalled();
    expect(agenda.schedule).toHaveBeenCalled(); // 🔥 branch
  });

  // ================= REMOVE =================

  it("should delete task without job", async () => {
    Task.findOneAndDelete.mockResolvedValue({});

    const res = await taskService.remove("1", "user1");

    expect(res).toBeDefined();
    expect(agenda.cancel).not.toHaveBeenCalled(); // 🔥 branch
  });

  it("should delete task and cancel job", async () => {
    Task.findOneAndDelete.mockResolvedValue({ jobId: "job1" });

    await taskService.remove("1", "user1");

    expect(agenda.cancel).toHaveBeenCalledWith({ _id: "job1" }); // 🔥 branch
  });

  it("should fail delete if task not found", async () => {
    Task.findOneAndDelete.mockResolvedValue(null);

    await expect(taskService.remove("1", "user1"))
      .rejects.toThrow("Task not found");
  });
});