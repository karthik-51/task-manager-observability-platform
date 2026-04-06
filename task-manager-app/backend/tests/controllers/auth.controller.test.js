const authController = require("../../src/controllers/auth.controller");
const authService = require("../../src/services/auth.service");

jest.mock("../../src/services/auth.service");
jest.mock("../../src/config/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe("Auth Controller", () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  // REGISTER
  it("should register user", async () => {
    req.body = { email: "test@test.com" };
    authService.register.mockResolvedValue({ _id: "123" });

    await authController.register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
  });

  it("should handle register error", async () => {
    authService.register.mockRejectedValue(new Error("Fail"));

    await authController.register(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  // LOGIN
  it("should login user", async () => {
    req.body = { email: "test@test.com", password: "123" };

    authService.login.mockResolvedValue({
      accessToken: "a",
      refreshToken: "b",
      user: { id: "1", name: "test", email: "test@test.com" },
    });

    await authController.login(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  it("should handle login error", async () => {
    authService.login.mockRejectedValue(new Error("Fail"));

    await authController.login(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  // REFRESH
  it("should refresh token", async () => {
    req.body = { refreshToken: "token" };
    authService.refresh.mockResolvedValue({ accessToken: "new" });

    await authController.refresh(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  it("should fail if refresh token missing", async () => {
    req.body = {};

    await authController.refresh(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  // FORGOT PASSWORD
  it("should send forgot password", async () => {
    req.body = { email: "test@test.com" };
    authService.forgotPassword.mockResolvedValue({ token: "abc" });

    await authController.forgotPassword(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  it("should handle forgot password error", async () => {
    authService.forgotPassword.mockRejectedValue(new Error("Fail"));

    await authController.forgotPassword(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  // RESET PASSWORD
  it("should reset password", async () => {
    req.params = { token: "abc" };
    req.body = { password: "newpass" };

    authService.resetPassword.mockResolvedValue({ message: "done" });

    await authController.resetPassword(req, res, next);

    expect(res.json).toHaveBeenCalled();
  });

  it("should fail if password missing", async () => {
    req.params = { token: "abc" };
    req.body = {};

    await authController.resetPassword(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});