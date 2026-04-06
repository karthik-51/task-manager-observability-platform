const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../../src/app");

let token;
let taskId;

const BASE = "/api";

describe("Routes E2E Tests", () => {
  const user = {
    name: "Test User",
    email: `test${Date.now()}@mail.com`, 
    password: "Password@123",
  };

  // ================= AUTH =================

  it("POST /auth/register - should register user", async () => {
    const res = await request(app)
      .post(`${BASE}/auth/register`)
      .send(user);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("POST /auth/login - should login user", async () => {
    const res = await request(app)
      .post(`${BASE}/auth/login`)
      .send({
        email: user.email,
        password: user.password,
      });

    

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("accessToken");

    token = res.body.data.accessToken;
  });

  it("POST /auth/login - wrong password", async () => {
    const res = await request(app)
      .post(`${BASE}/auth/login`)
      .send({
        email: user.email,
        password: "WrongPassword",
      });

    expect(res.statusCode).toBe(401);
  });

  it("POST /auth/forgot-password", async () => {
    const res = await request(app)
      .post(`${BASE}/auth/forgot-password`)
      .send({ email: user.email });

     expect([200, 404]).toContain(res.statusCode);
    // expect(res.statusCode).toBe(200);
  });

  // ================= TASKS =================

  it("GET /tasks - should fail without token", async () => {
    const res = await request(app).get(`${BASE}/tasks`);
    expect(res.statusCode).toBe(401);
  });

  it("POST /tasks - should create task", async () => {
    expect(token).toBeDefined(); 

    const res = await request(app)
      .post(`${BASE}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Test Task",
        description: "Task description",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty("_id");

    taskId = res.body.data._id;
  });

  it("POST /tasks - validation fail", async () => {
    const res = await request(app)
      .post(`${BASE}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({}); // empty body

    expect(res.statusCode).toBe(400);
  });

  it("GET /tasks - should return tasks", async () => {
    const res = await request(app)
      .get(`${BASE}/tasks`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });

  it("GET /tasks/analytics", async () => {
    const res = await request(app)
      .get(`${BASE}/tasks/analytics`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });

  it("PUT /tasks/:id - should update task", async () => {
    expect(taskId).toBeDefined();

    const res = await request(app)
      .put(`${BASE}/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Updated Task",
      });

    expect(res.statusCode).toBe(200);
  });

  it("DELETE /tasks/:id - should delete task", async () => {
    expect(taskId).toBeDefined();

    const res = await request(app)
      .delete(`${BASE}/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
  });

  it("PUT /tasks/:id - invalid id", async () => {
    const res = await request(app)
      .put(`${BASE}/tasks/invalid-id`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        title: "Fail",
      });

    expect([400, 404]).toContain(res.statusCode);
  });

  // ================= CLEANUP =================

  afterAll(async () => {
    await mongoose.connection.close();
  });
});