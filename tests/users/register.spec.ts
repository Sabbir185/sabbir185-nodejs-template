/* eslint-disable @typescript-eslint/no-explicit-any */
import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entity/User";
import { truncateTables } from "../utils";

// 3 principal --> AAA
// A -> Arrange, A -> Act, A -> Assert

describe("POST /auth/register", () => {
    let connection: DataSource;

    // jest hook
    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        // database truncate
        await truncateTables(connection);
    });

    afterAll(async () => {
        await connection.destroy();
    });

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
            const response = await request(app as any)
                .post("/auth/register")
                .send(userData);
            // Assert
            expect(response.statusCode).toBe(201);
        });

        it("should return valid json response", async () => {
            // Arrange
            const userData = {
                email: "test@example.com",
                password: "password123",
                firstName: "John",
                lastName: "Doe",
            };
            // Act
            const response = await request(app as any)
                .post("/auth/register")
                .send(userData);
            // Assert
            expect(
                (response.headers as Record<string, string>)["content-type"],
            ).toEqual(expect.stringContaining("json"));
        });

        it("should persist the user in the database", async () => {
            // Arrange
            const userData = {
                email: "test@example.com",
                password: "password123",
                firstName: "John",
                lastName: "Doe",
            };
            // Act
            await request(app as any)
                .post("/auth/register")
                .send(userData);
            // Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(1);
            expect(users[0].email).toEqual(userData.email);
            expect(users[0].firstName).toEqual(userData.firstName);
            expect(users[0].lastName).toEqual(userData.lastName);
        });

        it("it should return an id of the created user", async () => {
            // Arrange
            const userData = {
                email: "test@example.com",
                password: "password123",
                firstName: "John",
                lastName: "Doe",
            };
            // Act
            const res = await request(app as any)
                .post("/auth/register")
                .send(userData);
            // Assert
            expect(res.body).toHaveProperty("id");
            expect(typeof res.body.id).toBe("number");
        });
    });

    // For bad case
    describe("Fields are missing", () => {});
});
