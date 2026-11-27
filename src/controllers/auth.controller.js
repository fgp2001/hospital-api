import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { toUserResponse } from "../dtos/user.dto.js";
import { AppError } from "../errors/app-error.js";
import { issueAccessToken } from "../utils/jwt.js";

//POST login
export const login = async (req, res) => {
    const { email, password } = req.dto;

    const user = await User.findOne({
        where: { email },
    });

    const validPassword = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !user.isActive || !validPassword) {
        throw new AppError("Invalid credentials", {
            status: 401,
            code: "INVALID_CREDENTIALS",
        });
    }

    const accessToken = issueAccessToken(user);

    return res.status(200).json({
        accessToken,
        tokenType: "Bearer",
        expiresIn: 900,
    });
};

// GET me
export const getAuthenticatedUser = async (req, res) => {
    return res.status(200).json({
        data: toUserResponse(req.authUser),
    })
}