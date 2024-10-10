import { body, checkSchema } from "express-validator";

// method: 1
// export default [body('email').notEmpty().withMessage("Email is required!")];

// method: 2 -> schema object
export default checkSchema({
    email: {
        errorMessage: "Email is required!",
        notEmpty: true,
    },
});
