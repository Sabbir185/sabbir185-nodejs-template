import { Request } from "express";
import { expressjwt, GetVerificationKey } from "express-jwt";
import jwksClient from "jwks-rsa";
import { Config } from "../config";

export default expressjwt({
    secret: jwksClient.expressJwtSecret({
        jwksUri: Config.JWKS_URI as string,
        cache: true,
        rateLimit: true,
    }) as GetVerificationKey,
    algorithms: ["RS256"],
    getToken(req: Request) {
        // check token from headers
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader?.split(" ")[1] === "Bearer") {
            const token = authHeader.split(" ")[1];
            if (token) {
                return token;
            }
        }
        // or find token from cookies
        const { accessToken } = req.cookies;
        return accessToken;
    },
});
