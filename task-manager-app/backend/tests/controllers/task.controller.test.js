const taskController = require("../../src/controllers/task.controller");
const taskService = require("../../src/services/task.service");

jest.mock("../../src/services/task.service");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe("Task Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { id: "user1" },
      body: {},
      params: {},
      query: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it("should create task", async () => {
    taskService.create.mockResolvedValue({ _id: "task1" });

    await taskController.create(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("should handle create error", async () => {
    taskService.create.mockRejectedValue(new Error());

    await taskController.create(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("should get all tasks", async () => {
    taskService.getAll.mockResolvedValue([]);

    await taskController.getAll(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  it("should update task", async () => {
    req.params.id = "1";
    taskService.update.mockResolvedValue({});

    await taskController.update(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  it("should delete task", async () => {
    req.params.id = "1";
    taskService.remove.mockResolvedValue();

    await taskController.delete(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      message: "Task deleted successfully",
    });
  });

  it("should handle delete error", async () => {
    taskService.remove.mockRejectedValue(new Error());

    await taskController.delete(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});