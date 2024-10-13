/* eslint-disable @typescript-eslint/no-explicit-any */
import request from "supertest";
import app from "../../src/app";
import { DataSource } from "typeorm";
import { AppDataSource } from "../../src/config/data-source";
import { User } from "../../src/entity/User";
import { Roles } from "../../src/constants";
import { isJWT } from "../utils";
import { RefreshToken } from "../../src/entity/RefreshToken";
// import { truncateTables } from "../utils";

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
        // await truncateTables(connection);

        // manually synchronize the database
        await connection.dropDatabase();
        await connection.synchronize();
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

        it("should return an id of the created user", async () => {
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

        it("should have a customer role", async () => {
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
            expect(users[0]).toHaveProperty("role");
            expect(users[0].role).toBe(Roles.CUSTOMER);
        });

        it("should store the hashed password in the database", async () => {
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
            expect(users[0].password).not.toBe(userData.password);
            expect(users[0].password).toHaveLength(60);
            expect(users[0].password).toMatch(/^\$2b\$\d+\$/);
        });

        it("should return 400 status code if email is already exists", async () => {
            // Arrange
            const userData = {
                email: "test@example.com",
                password: "password123",
                firstName: "John",
                lastName: "Doe",
            };
            const userRepository = connection.getRepository(User);
            await userRepository.save({ ...userData, role: Roles.CUSTOMER });
            // Act
            const response = await request(app as any)
                .post("/auth/register")
                .send(userData);
            const user = await userRepository.find();
            // Assert
            expect(response.statusCode).toBe(400);
            expect(user).toHaveLength(1);
        });

        it("should return the access and refresh token inside a cookie", async () => {
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
            interface Headers {
                ["set-cookie"]: string[];
            }
            const cookies =
                (response.headers as unknown as Headers)["set-cookie"] || [];
            let accessToken: string = "";
            let refreshToken: string = "";
            cookies.forEach((cookie) => {
                if (cookie.startsWith("accessToken=")) {
                    accessToken = cookie.split(";")[0].split("=")[1];
                }
                if (cookie.startsWith("refreshToken=")) {
                    refreshToken = cookie.split(";")[0].split("=")[1];
                }
            });
            expect(accessToken).not.toBeFalsy();
            expect(refreshToken).not.toBeFalsy();
            expect(isJWT(accessToken)).toBeTruthy();
            expect(isJWT(refreshToken)).toBeTruthy();
        });

        it("sholud store the refresh token in the database", async () => {
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
            const refreshTokenRepository =
                connection.getRepository(RefreshToken);
            // const refreshTokens = await refreshTokenRepository.find();
            // expect(refreshTokens).toHaveLength(1);
            const tokens = await refreshTokenRepository
                .createQueryBuilder("refreshToken")
                .where("refreshToken.userId = :userId", {
                    userId: (response.body as Record<string, string>).id,
                })
                .getMany();
            expect(tokens).toHaveLength(1);
        });
    });

    // For bad case
    describe("Fields are missing", () => {
        it("should return 400 status code if email field is missing", async () => {
            // Arrange
            const userData = {
                email: "",
                password: "password123",
                firstName: "John",
                lastName: "Doe",
            };
            // Act
            const response = await request(app as any)
                .post("/auth/register")
                .send(userData);
            // Assert
            expect(response.statusCode).toBe(400);
            const userRepository = connection.getRepository(User);
            const user = await userRepository.find();
            expect(user).toHaveLength(0);
        });

        it.todo("should return 400 status code if password field is missing");
        it.todo("should return 400 status code if firstName field is missing");
        it.todo("should return 400 status code if lastName field is missing");
    });

    describe("Fields are not in proper format", () => {
        it("should trim the email field", async () => {
            // Arrange
            const userData = {
                email: "  test@example.com  ",
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
            expect(users[0].email).toBe("test@example.com");
        });

        it.todo(
            "should return 400 status code if email is not a valid email address",
        );
    });
});
