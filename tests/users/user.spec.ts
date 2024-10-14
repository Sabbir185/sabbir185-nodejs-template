/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataSource } from "typeorm";
import request from "supertest";
import createJWKSMock from "mock-jwks";
import { AppDataSource } from "../../src/config/data-source";
import app from "../../src/app";
import { User } from "../../src/entity/User";
import { Roles } from "../../src/constants";

describe("Get /auth/self", () => {
    let connection: DataSource;
    let jwks: ReturnType<typeof createJWKSMock>;

    // jest hook
    beforeAll(async () => {
        jwks = createJWKSMock("http://localhost:5501");
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        jwks.start();

        // database truncate
        // await truncateTables(connection);

        // manually synchronize the database
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterEach(async () => {
        jwks.stop();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe("Given all fields", () => {
        it("should return 200 status code", async () => {
            const accessToken = jwks.token({
                sub: "1",
                role: Roles.CUSTOMER,
            });
            const response = await request(app as any)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send();
            // Assert
            expect(response.statusCode).toBe(200);
        });

        it("should return the user data", async () => {
            // register a user
            const userData = {
                email: "test@example.com",
                password: "password123",
                firstName: "John",
                lastName: "Doe",
            };
            const userRepository = connection.getRepository(User);
            const data = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });
            // generate token
            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            });
            // add token to cookie
            const response = await request(app as any)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken};`])
                .send();
            // Assert
            // check if user id matches with the registered user id
            expect(response.body.id).toBe(data.id);
        });

        it("should not return the user password", async () => {
            // register a user
            const userData = {
                email: "test@example.com",
                password: "password123",
                firstName: "John",
                lastName: "Doe",
            };
            const userRepository = connection.getRepository(User);
            const data = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });
            // generate token
            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            });
            // add token to cookie
            const response = await request(app as any)
                .get("/auth/self")
                .set("Cookie", [`accessToken=${accessToken};`])
                .send();
            // Assert
            // check if user id matches with the registered user id
            expect(response.body).not.toHaveProperty("password");
        });
    });
});
