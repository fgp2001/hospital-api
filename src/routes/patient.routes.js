import { Router } from "express";
import * as controller from "../controllers/patient.controller.js";
import { validateBody } from "../middlewares/validate-body.middleware.js";
import { validateId } from "../middlewares/validate-id.middleware.js";

import { createPatientDto, updatePatientDto } from "../dtos/patient.dto.js";

export const patientRouter = Router();

patientRouter.get("/search", controller.searchPatients);
patientRouter.get("/", controller.listPatients);
patientRouter.get("/:id", validateId("Patient"), controller.getPatientById);
patientRouter.post("/", validateBody(createPatientDto), controller.createPatient);
patientRouter.patch("/:id", validateId("Patient"), validateBody(updatePatientDto), controller.updatePatient);
patientRouter.delete("/:id", validateId("Patient"), controller.deletePatient);
