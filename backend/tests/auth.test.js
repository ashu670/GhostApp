const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");

describe("POST /api/auth/login", () => {
  afterAll(async () => {
    // Cleanly close mongoose after suite completes
    await mongoose.connection.close();
  });

  it("should reject invalid login credentials gracefully", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "thisisfake@example.com",
        password: "definitelywrongpassword"
      });

    // Validates that junk input doesn't crash the server (500)
    // and returns proper user-facing error formats (400 / 404)
    expect([400, 404]).toContain(res.statusCode);
    expect(res.body).toHaveProperty("message");
  });
});
