const analyticsController = require("../../src/controllers/analytics.controller");
const analyticsService = require("../../src/services/analytics.service");

jest.mock("../../src/services/analytics.service");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe("Analytics Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: { id: "user123" } };
    res = { json: jest.fn() };
    next = jest.fn();
  });

  it("should return analytics data", async () => {
    const mockData = { totalTasks: 10 };
    analyticsService.getAnalytics.mockResolvedValue(mockData);

    await analyticsController.getAnalytics(req, res, next);

    expect(analyticsService.getAnalytics).toHaveBeenCalledWith("user123");
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  it("should handle errors", async () => {
    const error = new Error("Failed");
    analyticsService.getAnalytics.mockRejectedValue(error);

    await analyticsController.getAnalytics(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});