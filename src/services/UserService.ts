import { Repository } from "typeorm";
import bcrypt from "bcrypt";
import { User } from "../entity/User";
import { UserData } from "../types";
import createHttpError from "http-errors";
import { Roles } from "../constants";

export class UserService {
    constructor(private userRepository: Repository<User>) {}

    async create({ firstName, lastName, email, password }: UserData) {
        // check if the email is already exists or not
        const user = await this.userRepository.findOne({
            where: { email: email },
        });
        if (user) {
            const err = createHttpError(400, "Email is already exists!");
            throw err;
        }
        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        try {
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            });
        } catch (error) {
            const err = createHttpError(
                500,
                "Failed to store the data in the database",
            );
            throw err;
        }
    }

    async findByEmail(email: string) {
        const user = await this.userRepository.findOne({
            where: { email: email },
        });
        return user;
    }

    async findById(id: number) {
        return await this.userRepository.findOne({
            where: { id },
        });
    }
}
