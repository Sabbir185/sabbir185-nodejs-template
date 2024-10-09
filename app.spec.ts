/* eslint-disable @typescript-eslint/no-explicit-any */
import app from "./src/app";
import { doSum } from "./src/utils";
import request from "supertest";

describe.skip("App", () => {
    // unit tests
    it("should summary", () => {
        const rr = doSum(2, 3);
        expect(rr).toBe(5);
    });

    // integration tests
    it("should should return 200 status code", async () => {
        const response = await request(app as any)
            .get("/")
            .send();
        expect(response.statusCode).toBe(200);
    });
});
