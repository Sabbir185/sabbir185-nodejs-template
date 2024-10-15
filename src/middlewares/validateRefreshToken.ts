import { expressjwt } from "express-jwt";
import { Config } from "../config";
import { Request } from "express";
import { AppDataSource } from "../config/data-source";
import { RefreshToken } from "../entity/RefreshToken";
import logger from "../config/logger";
import { IRefreshTokenPayload } from "../types";

export default expressjwt({
    secret: Config.REFRESH_TOKEN_SECRET as string,
    algorithms: ["HS256"],
    getToken: (req: Request) => {
        const { refreshToken } = req.cookies;
        return refreshToken;
    },
    isRevoked: async (req: Request, token) => {
        try {
            const refreshTokenRepository =
                AppDataSource.getRepository(RefreshToken);
            const refreshToken = await refreshTokenRepository.findOne({
                where: {
                    id: Number((token?.payload as IRefreshTokenPayload).jwtid),
                },
            });
            return refreshToken === null;
        } catch (error) {
            logger.error("Error while getting the refresh token", {
                id: Number((token?.payload as IRefreshTokenPayload).jwtid),
            });
        }
        return false;
    },
});
