import { NextFunction, Request, Response } from "express";
import { AuthRequest, RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";
import { Logger } from "winston";
import { validationResult } from "express-validator";
import { JwtPayload } from "jsonwebtoken";
import { TokenService } from "../services/tokenService";
import createHttpError from "http-errors";
import { User } from "../entity/User";
import { CredentialService } from "../services/CredentialService";

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
        private tokenService: TokenService,
        private credentialService: CredentialService,
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

            // access and refresh jwt token
            const payload: JwtPayload = {
                sub: String(user.id),
                email: user.email,
                role: user.role,
            };
            // Persist the refresh token
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user);
            const accessToken = this.tokenService.generateAccessToken(payload);
            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                jwtid: String(newRefreshToken.id),
            });
            res.cookie("accessToken", accessToken, {
                domain: "localhost",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60, // 1h
                httpOnly: true,
                secure: true,
            });
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

    async login(req: RegisterUserRequest, res: Response, next: NextFunction) {
        // validation
        const result = validationResult(req);
        if (!result.isEmpty()) {
            return res.status(400).json({ errors: result.array() });
        }
        const { email, password } = req.body;
        this.logger.debug("User trying to logging", {
            email,
            password: "******",
        });
        try {
            const user = (await this.userService.findByEmail(email)) as User;
            if (!user) {
                const err = createHttpError(
                    400,
                    "Email or password is incorrect!",
                );
                return next(err);
            }
            // check password
            const isPasswordCorrect =
                await this.credentialService.comparePassword(
                    password,
                    user.password,
                );
            if (isPasswordCorrect === false) {
                const err = createHttpError(
                    400,
                    "Email or password is incorrect!",
                );
                return next(err);
            }
            // access and refresh jwt token
            const payload: JwtPayload = {
                sub: String(user.id),
                email: user.email,
                role: user.role,
            };
            // Persist the refresh token
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user);
            const accessToken = this.tokenService.generateAccessToken(payload);
            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                jwtid: String(newRefreshToken.id),
            });
            res.cookie("accessToken", accessToken, {
                domain: "localhost",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60, // 1h
                httpOnly: true,
                secure: true,
            });
            res.cookie("refreshToken", refreshToken, {
                domain: "localhost",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 * 24 * 365, // 1y
                httpOnly: true,
                secure: true,
            });
            this.logger.info("User login in", { id: user.id });
            return res.status(200).json({ id: user.id });
        } catch (error) {
            return next(error);
        }
    }

    async self(req: AuthRequest, res: Response, next: NextFunction) {
        const user = await this.userService.findById(Number(req.auth.sub));
        return res.status(200).json({ ...user, password: undefined });
    }

    async refresh(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            // access and refresh jwt token
            const payload: JwtPayload = {
                sub: req.auth.sub,
                email: req.auth.email,
                role: req.auth.role,
            };
            const user = await this.userService.findById(Number(req.auth.sub));
            if (!user) {
                const err = createHttpError(
                    400,
                    "User not found with the refresh token!",
                );
                return next(err);
            }
            // delete the previous refresh token from the database
            await this.tokenService.deleteRefreshToken(+req.auth.jwtid);
            // Persist the refresh token
            const newRefreshToken =
                await this.tokenService.persistRefreshToken(user);
            const accessToken = this.tokenService.generateAccessToken(payload);
            const refreshToken = this.tokenService.generateRefreshToken({
                ...payload,
                jwtid: String(newRefreshToken.id),
            });
            res.cookie("accessToken", accessToken, {
                domain: "localhost",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60, // 1h
                httpOnly: true,
                secure: true,
            });
            res.cookie("refreshToken", refreshToken, {
                domain: "localhost",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 * 24 * 365, // 1y
                httpOnly: true,
                secure: true,
            });
            this.logger.info("User generated refresh token", { id: user.id });
            return res.status(200).json({ id: user.id });
        } catch (error) {
            const err = createHttpError(
                500,
                "Failed to generate refresh token",
            );
            return next(err);
        }
    }
}
