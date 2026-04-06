const nodemailer = require("nodemailer");

jest.mock("nodemailer");

const sendMailMock = jest.fn();

nodemailer.createTransport.mockReturnValue({
  sendMail: sendMailMock,
});

const mailService = require("../../src/services/mail.service");

describe("Mail Service", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should send overdue email", async () => {
    sendMailMock.mockResolvedValue({ messageId: "123" });

    const res = await mailService.sendOverdueEmail(
      "test@mail.com",
      "User",
      "Task"
    );

    expect(res.messageId).toBe("123");
  });

  it("should handle email error", async () => {
    sendMailMock.mockRejectedValue(new Error("fail"));

    await expect(
      mailService.sendOverdueEmail("a", "b", "c")
    ).rejects.toThrow();
  });

  it("should send reset email", async () => {
    sendMailMock.mockResolvedValue({ messageId: "123" });

    const res = await mailService.sendPasswordResetEmail(
      "test@mail.com",
      "url"
    );

    expect(res.messageId).toBe("123");
  });
});