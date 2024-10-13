import fs from "fs";
import path from "path";
import { NextFunction, Response } from "express";
import { RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import { JwtPayload, sign } from "jsonwebtoken";
import createHttpError from "http-errors";
import { Config } from "../config";
import { AppDataSource } from "../config/data-source";
import { RefreshToken } from "../entity/RefreshToken";

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
    ) {}

    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        // validation
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }
        const { firstName, lastName, email, password } = req.body;
        this.logger.debug("New request to register a user", {
            firstName,
            lastName,
            email,
            password: "******",
        });
        try {
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
            });
            this.logger.info("User has been registered", { id: user.id });

            // access token
            let privateKey: Buffer;
            try {
                privateKey = fs.readFileSync(
                    path.resolve(__dirname, "../../certs/privateKey.pem"),
                );
            } catch (error) {
                const err = createHttpError(
                    500,
                    "Failed to read the private key",
                );
                return next(err);
            }
            const payload: JwtPayload = {
                sub: String(user.id),
                email: user.email,
                role: user.role,
            };
            const accessToken = sign(payload, privateKey, {
                algorithm: "RS256",
                expiresIn: "1h",
                issuer: "auth-service",
            });
            res.cookie("accessToken", accessToken, {
                domain: "localhost",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60, // 1h
                httpOnly: true,
                secure: true,
            });

            // Persist the refresh token
            const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365;
            const refreshTokenRepository =
                AppDataSource.getRepository(RefreshToken);
            const newRefreshToken = await refreshTokenRepository.save({
                user,
                expiresAt: new Date(Date.now() + MS_IN_YEAR),
            });
            // refresh token
            const refreshToken = sign(
                payload,
                Config.REFRESH_TOKEN_SECRET as string,
                {
                    algorithm: "HS256",
                    expiresIn: "1y",
                    issuer: "auth-service",
                    jwtid: String(newRefreshToken.id),
                },
            );
            res.cookie("refreshToken", refreshToken, {
                domain: "localhost",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 * 24 * 365, // 1y
                httpOnly: true,
                secure: true,
            });
            return res.status(201).json({ id: user.id });
        } catch (error) {
            next(error);
            return;
        }
    }
}
