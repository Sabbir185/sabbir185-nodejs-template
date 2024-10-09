import { Response } from "express";
import { RegisterUserRequest } from "../types";
import { UserService } from "../services/UserService";

export class AuthController {
    constructor(private userService: UserService) {}

    async register(req: RegisterUserRequest, res: Response) {
        const { firstName, lastName, email, password } = req.body;
        const user = await this.userService.create({
            firstName,
            lastName,
            email,
            password,
        });
        return res.status(201).json({ id: user.id });
    }
}
