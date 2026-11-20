import { Router } from "express";
import * as controller from "../controllers/doctor.controller.js";
import { validateBody } from "../middlewares/validate-body.middleware.js";
import { validateId } from "../middlewares/validate-id.middleware.js"

import { createDoctorDto, updateDoctorDto } from "../dtos/doctor.dto.js";

export const doctorRouter = Router();

doctorRouter.get("/search", controller.searchDoctors);
doctorRouter.get("/", controller.listDoctors);
doctorRouter.get("/:id", validateId("Doctor"), controller.getDoctorById);
doctorRouter.post("/", validateBody(createDoctorDto), controller.createDoctor);
doctorRouter.patch("/:id", validateId("Doctor"), validateBody(updateDoctorDto), controller.updateDoctor);
doctorRouter.delete("/:id", validateId("Doctor"), controller.deleteDoctor);
