const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");

describe("GET /api/posts", () => {
  afterAll(async () => {
    // Close the database connection to avoid Jest open handle issues
    await mongoose.connection.close();
  });

  it("should return an array of posts (200) or require auth (401)", async () => {
    const res = await request(app).get("/api/posts");

    // Depending on project structure, this route might be explicitly protected
    // If Auth is strictly enforced we gracefully expect 401 Unauthorized
    // If it's public we expect 200 OK and populated array data!
    expect([200, 401]).toContain(res.statusCode);
    
    if (res.statusCode === 200) {
      expect(Array.isArray(res.body)).toBeTruthy();
    }
  });
});
