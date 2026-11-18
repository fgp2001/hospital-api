import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { toUserResponse } from "../dtos/user.dto.js";
import { AppError } from "../errors/app-error.js";

export const login = async (req, res) => {
    const { email, password } = req.dto;

    const user = await User.findOne({
        where: { email },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new AppError("Invalid credentials", {
            status: 401,
            code: "INVALID_CREDENTIALS",
        });
    }

    res.json({ data: toUserResponse(user) });
};