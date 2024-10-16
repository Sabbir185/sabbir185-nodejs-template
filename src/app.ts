import "reflect-metadata";
import express, { NextFunction, Request, Response } from "express";
import cookieParser from "cookie-parser";
import { HttpError } from "http-errors";
import logger from "./config/logger";
import authRouter from "./routes/auth";

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
    res.status(200).send("Hello, World...!");
});

app.use("/auth", authRouter);

/* eslint-disable @typescript-eslint/no-unused-vars */
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message);
    const statusCode = err.statusCode || err.status || 500;
    return res.status(statusCode).json({
        error: [
            {
                type: err.name,
                msg: err.message,
                path: "",
                location: "",
            },
        ],
    });
});

export default app;
