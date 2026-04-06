const analyticsService = require("../../src/services/analytics.service");
const Task = require("../../src/models/task.model");

jest.mock("../../src/models/task.model");

describe("Analytics Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return full analytics data", async () => {
    Task.aggregate
      .mockResolvedValueOnce([{ _id: "todo", count: 5 }]) // status
      .mockResolvedValueOnce([{ _id: "high", count: 3 }]) // priority
      .mockResolvedValueOnce([]) // matrix
      .mockResolvedValueOnce([{ avgLeadTime: 2 }]) // lead time
      .mockResolvedValueOnce([]) // daily created
      .mockResolvedValueOnce([]) // daily completed
      .mockResolvedValueOnce([]) // deadlines
      .mockResolvedValueOnce([]); // age

    Task.countDocuments
      .mockResolvedValueOnce(2) // overdue
      .mockResolvedValueOnce(1); // today

    const result = await analyticsService.getAnalytics("507f1f77bcf86cd799439011");

    expect(result).toHaveProperty("statusCounts");
    expect(result).toHaveProperty("priorityCounts");
    expect(result).toHaveProperty("avgLeadTime");
  });

  it("should handle empty lead time", async () => {
    Task.aggregate
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]) // no lead time
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    Task.countDocuments
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);

    const result = await analyticsService.getAnalytics("507f1f77bcf86cd799439011");

    expect(result.avgLeadTime).toBeNull();
  });
});