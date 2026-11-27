import { Router } from "express";
import { login, getAuthenticatedUser } from "../controllers/auth.controller.js";
import { validateBody } from "../middlewares/validate-body.middleware.js";
import { loginDto } from "../dtos/auth.dto.js";
import { authenticate } from "../middlewares/auth.middleware.js";

export const authRouter = Router();

authRouter.post("/login", validateBody(loginDto), login);
authRouter.get("/me", authenticate, getAuthenticatedUser);