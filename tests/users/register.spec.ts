import request from "supertest";
import app from "../../src/app";

// 3 principal --> AAA
// A -> Arrange, A -> Act, A -> Assert

describe("POST /auth/register", () => {
    // For good case
    describe("Given all fields", () => {
        it("should return the 201 status code", async () => {
            // Arrange
            const userData = {
                email: "test@example.com",
                password: "password123",
                firstName: "John",
                lastName: "Doe",
            };
            // Act
            const response = await request(app)
                .post("/auth/register")
                .send(userData);
            // Assert
            expect(response.statusCode).toBe(201);
        });
    });

    // For bad case
    describe("Fields are missing", () => {});
});
