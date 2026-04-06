const mongoose = require("mongoose");
const User = require("../../src/models/user.model");

describe("User Model", () => {

  it("should create user with hashed password", async () => {
    const user = new User({
      name: "Test User",
      email: "test@mail.com",
      password: "123456"
    });

    const saved = await user.save();

    expect(saved._id).toBeDefined();
    expect(saved.password).not.toBe("123456"); // hashed
  });

  it("should fail without required fields", async () => {
    const user = new User({});

    await expect(user.save()).rejects.toThrow();
  });

  it("should enforce unique email", async () => {
    const user1 = new User({
      name: "User1",
      email: "unique@mail.com",
      password: "123456"
    });

    await user1.save();

    const user2 = new User({
      name: "User2",
      email: "unique@mail.com",
      password: "123456"
    });

    await expect(user2.save()).rejects.toThrow();
  });

  it("should set default role as user", async () => {
    const user = new User({
      name: "Role Test",
      email: "role@mail.com",
      password: "123456"
    });

    const saved = await user.save();

    expect(saved.role).toBe("user");
  });

  it("should accept admin role", async () => {
    const user = new User({
      name: "Admin",
      email: "admin@mail.com",
      password: "123456",
      role: "admin"
    });

    const saved = await user.save();

    expect(saved.role).toBe("admin");
  });

  it("should hash password only when modified", async () => {
    const user = new User({
      name: "Hash Test",
      email: "hash@mail.com",
      password: "123456"
    });

    const saved = await user.save();
    const originalPassword = saved.password;

    saved.name = "Updated Name";
    await saved.save();

    expect(saved.password).toBe(originalPassword); // not rehashed
  });

});