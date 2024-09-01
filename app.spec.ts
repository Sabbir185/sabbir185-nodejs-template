import { doSum } from "./src/utils";

describe("App", () => {
    // unit tests
    it("should summary", () => {
        const rr = doSum(2, 3);
        expect(rr).toBe(5);
    });
});
