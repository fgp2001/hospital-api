import { Router } from "express";
import * as controller from "../controllers/nurse.controller.js";
import { validateBody } from "../middlewares/validate-body.middleware.js";
import { validateId } from "../middlewares/validate-id.middleware.js"
import { createNurseDto, updateNurseDto } from "../dtos/nurse.dto.js";

export const nurseRouter = Router();

nurseRouter.get("/search", controller.searchNurses);
nurseRouter.get("/", controller.listNurses);
nurseRouter.get("/:id", validateId("Nurse"), controller.getNurseById);
nurseRouter.post("/", validateBody(createNurseDto), controller.createNurse);
nurseRouter.patch("/:id", validateId("Nurse"), validateBody(updateNurseDto), controller.updateNurse);
nurseRouter.delete("/:id", validateId("Nurse"), controller.deleteNurse);
