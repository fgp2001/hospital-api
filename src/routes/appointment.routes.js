import { Router } from "express";
import * as controller from "../controllers/appointment.controller.js";
import { validateBody } from "../middlewares/validate-body.middleware.js";
import { validateId } from "../middlewares/validate-id.middleware.js"
import { validateQuery } from "../middlewares/validate-query.middleware.js"

import { createAppointmentDto, updateAppointmentDto, searchAppointmentDto } from "../dtos/appointment.dto.js";

export const appointmentRouter = Router();

appointmentRouter.get("/search", validateQuery(searchAppointmentDto), controller.searchAppointments);
appointmentRouter.get("/", controller.listAppointments);
appointmentRouter.get("/:id", validateId("Appointment"), controller.getAppointmentById);
appointmentRouter.post("/", validateBody(createAppointmentDto), controller.createAppointment);
appointmentRouter.patch("/:id", validateId("Appointment"), validateBody(updateAppointmentDto), controller.updateAppointment);
appointmentRouter.delete("/:id", validateId("Appointment"), controller.deleteAppointment);