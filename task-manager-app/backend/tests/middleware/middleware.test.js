const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const authMiddleware = require("../../src/middleware/auth.middleware").auth;
const roleMiddleware = require("../../src/middleware/role.middleware").allow;
const validateMiddleware = require("../../src/middleware/validate.middleware");
const errorMiddleware = require("../../src/middleware/error.middleware");
const AppError = require("../../src/utils/AppError");

// Dummy Joi schema
const Joi = require("joi");

describe("Middleware E2E Tests", () => {

  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  // ================= AUTH =================

  it("should fail if no token provided", async () => {
    app.get("/test", authMiddleware, (req, res) => {
      res.send("OK");
    });
    app.use(errorMiddleware);

    const res = await request(app).get("/test");

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Authorization token missing");
  });

  it("should fail if token is invalid", async () => {
    app.get("/test", authMiddleware, (req, res) => {
      res.send("OK");
    });
    app.use(errorMiddleware);

    const res = await request(app)
      .get("/test")
      .set("Authorization", "Bearer invalidtoken");

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid or expired token");
  });

  it("should pass with valid token", async () => {
    const token = jwt.sign({ id: "123", role: "user" }, "testsecret");

    process.env.JWT_SECRET = "testsecret";

    app.get("/test", authMiddleware, (req, res) => {
      res.json({ user: req.user });
    });

    const res = await request(app)
      .get("/test")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.id).toBe("123");
  });

  // ================= ROLE =================

  it("should block access if role not allowed", async () => {
    app.get(
      "/admin",
      (req, res, next) => {
        req.user = { role: "user" };
        next();
      },
      roleMiddleware(["admin"]),
      (req, res) => res.send("OK")
    );

    const res = await request(app).get("/admin");

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toBe("Forbidden");
  });

  it("should allow access if role matches", async () => {
    app.get(
      "/admin",
      (req, res, next) => {
        req.user = { role: "admin" };
        next();
      },
      roleMiddleware(["admin"]),
      (req, res) => res.send("OK")
    );

    const res = await request(app).get("/admin");

    expect(res.statusCode).toBe(200);
  });

  // ================= VALIDATE =================

  const schema = Joi.object({
    name: Joi.string().required()
  });

  it("should fail validation", async () => {
    app.post(
      "/validate",
      validateMiddleware(schema),
      (req, res) => res.send("OK")
    );
    app.use(errorMiddleware);

    const res = await request(app)
      .post("/validate")
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it("should pass validation", async () => {
    app.post(
      "/validate",
      validateMiddleware(schema),
      (req, res) => res.send("OK")
    );

    const res = await request(app)
      .post("/validate")
      .send({ name: "Test" });

    expect(res.statusCode).toBe(200);
  });

  // ================= ERROR MIDDLEWARE =================

  it("should handle operational error", async () => {
    app.get("/error", (req, res, next) => {
      next(new AppError("Custom Error", 400));
    });
    app.use(errorMiddleware);

    const res = await request(app).get("/error");

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Custom Error");
  });

  it("should handle unknown error (500)", async () => {
    app.get("/error", (req, res, next) => {
      next(new Error("Unexpected"));
    });
    app.use(errorMiddleware);

    const res = await request(app).get("/error");

    expect(res.statusCode).toBe(500);
    expect(res.body.message).toBe("Internal Server Error");
  });

});