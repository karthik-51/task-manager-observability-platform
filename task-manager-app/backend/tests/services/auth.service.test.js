const authService = require("../../src/services/auth.service");
const User = require("../../src/models/user.model");
const jwt = require("jsonwebtoken");

jest.mock("../../src/models/user.model");
jest.mock("jsonwebtoken");

describe("Auth Service", () => {
  beforeEach(() => jest.clearAllMocks());

  // REGISTER
  it("should register user", async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({ _id: "1" });

    const res = await authService.register({ email: "a@test.com" });

    expect(res._id).toBe("1");
  });

  it("should fail if user exists", async () => {
    User.findOne.mockResolvedValue({});

    await expect(authService.register({ email: "a@test.com" }))
      .rejects.toThrow();
  });

  // LOGIN
  it("should login successfully", async () => {
    const mockUser = {
      _id: "1",
      name: "test",
      email: "a@test.com",
      role: "user",
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn(),
    };

    User.findOne.mockResolvedValue(mockUser);
    jwt.sign.mockReturnValue("token");

    const res = await authService.login("a@test.com", "123");

    expect(res.accessToken).toBe("token");
  });

  it("should fail if user not found", async () => {
    User.findOne.mockResolvedValue(null);

    await expect(authService.login("a@test.com", "123"))
      .rejects.toThrow();
  });

  it("should fail if password wrong", async () => {
    const mockUser = {
      comparePassword: jest.fn().mockResolvedValue(false),
    };

    User.findOne.mockResolvedValue(mockUser);

    await expect(authService.login("a@test.com", "123"))
      .rejects.toThrow();
  });

  // REFRESH
  it("should refresh token", async () => {
    jwt.verify.mockReturnValue({ id: "1" });

    User.findById.mockResolvedValue({
      _id: "1",
      refreshToken: "abc",
      name: "test",
      email: "a@test.com",
      role: "user",
    });

    const res = await authService.refresh("abc");

    expect(res).toHaveProperty("accessToken");
  });

  it("should fail invalid token", async () => {
    jwt.verify.mockImplementation(() => { throw new Error(); });

    await expect(authService.refresh("bad")).rejects.toThrow();
  });

  it("should fail token mismatch", async () => {
    jwt.verify.mockReturnValue({ id: "1" });

    User.findById.mockResolvedValue({ refreshToken: "xyz" });

    await expect(authService.refresh("abc")).rejects.toThrow();
  });

  // FORGOT PASSWORD
  it("should generate reset token", async () => {
    const mockUser = { save: jest.fn() };
    User.findOne.mockResolvedValue(mockUser);

    const res = await authService.forgotPassword("a@test.com");

    expect(res).toHaveProperty("token");
  });

  it("should fail if user not found", async () => {
    User.findOne.mockResolvedValue(null);

    await expect(authService.forgotPassword("a@test.com"))
      .rejects.toThrow();
  });

  // RESET PASSWORD
  it("should reset password", async () => {
    const mockUser = { save: jest.fn() };
    User.findOne.mockResolvedValue(mockUser);

    const res = await authService.resetPassword("token", "newpass");

    expect(res.message).toBeDefined();
  });

  it("should fail invalid token", async () => {
    User.findOne.mockResolvedValue(null);

    await expect(authService.resetPassword("bad", "pass"))
      .rejects.toThrow();
  });
});