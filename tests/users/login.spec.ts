/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataSource } from "typeorm";
import request from "supertest";
import { AppDataSource } from "../../src/config/data-source";
import app from "../../src/app";

describe("POST /auth/login", () => {
    let connection: DataSource;

    // jest hook
    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        // database truncate
        // await truncateTables(connection);

        // manually synchronize the database
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe("Given all fields", () => {
        it("should login the user", async () => {
            // Arrange
            const userData = {
                email: "test@example.com",
                password: "password123",
                firstName: "John",
                lastName: "Doe",
            };
            const loginData = {
                email: "test@example.com",
                password: "password123",
            };
            // Act
            await request(app as any)
                .post("/auth/register")
                .send(userData);
            const response = await request(app as any)
                .post("/auth/login")
                .send(loginData);
            // Assert
            expect(response.status).toBe(200);
        });
    });
});
