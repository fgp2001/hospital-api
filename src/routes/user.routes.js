import { Router } from "express";
import * as controller from "../controllers/user.controller.js";
import { validateBody } from "../middlewares/validate-body.middleware.js";
import { validateUserId } from "../middlewares/validate-id.middleware.js";
import { createUserDTO, updateUserDTO, assignRoleDTO } from "../dtos/user.dto.js";

export const userRouter = Router();

userRouter.get("/search", controller.search);
userRouter.get("/", controller.list);
userRouter.get("/:id", validateUserId, controller.getById);
userRouter.post("/", validateBody(createUserDTO), controller.create);
userRouter.patch("/:id/role", validateUserId, validateBody(assignRoleDTO), controller.assignRole);
userRouter.patch("/:id", validateUserId, validateBody(updateUserDTO), controller.update);
userRouter.delete("/:id", validateUserId, controller.remove);
