import { Appointment, Doctor, Patient } from "../models/index.js";
import { AppError } from "../errors/app-error.js";
import { toAppointmentResponse } from "../dtos/appointment.dto.js";

const withRelations = [
    {
        model: Patient,
        as: "patient",
        attributes: ["id", "firstName", "lastName"],
    },
    {
        model: Doctor,
        as: "doctor",
        attributes: ["id", "firstName", "lastName"],
    },
];

const appointmentNotFound = () =>
    new AppError("Appointment not found", {
        status: 404,
        code: "APPOINTMENT_NOT_FOUND",
    });

const validateReferences = async ({ patientId, doctorId }) => {
    if (patientId !== undefined) {
        const patient = await Patient.findByPk(patientId);


        if (!patient) {
            throw new AppError("Referenced resource does not exist", {
                status: 400,
                code: "INVALID_REFERENCE",
            });
        }
    }

    if (doctorId !== undefined) {
        const doctor = await Doctor.findByPk(doctorId);


        if (!doctor) {
            throw new AppError("Referenced resource does not exist", {
                status: 400,
                code: "INVALID_REFERENCE",
            });
        }
    }
};

export const listAppointments = async (req, res) => {
    const appointments = await Appointment.findAll({
        include: withRelations,
        order: [
            ["date", "DESC"],
            ["id", "DESC"]
        ],
    });

    res.json({
        data: appointments.map(toAppointmentResponse),
    });
};

export const searchAppointments = async (req, res) => {

    const { patientId, doctorId, date } = req.validatedQuery;

    const where = {};

    if (patientId !== undefined) {
        where.patientId = patientId;
    }

    if (doctorId !== undefined) {
        where.doctorId = doctorId;
    }

    if (date !== undefined) {
        where.date = date;
    }

    const appointments = await Appointment.findAll({
        where,
        include: withRelations,
        order: [
            ["date", "DESC"],
            ["id", "DESC"],
        ],
    });

    res.json({ data: appointments.map(toAppointmentResponse) });
};

export const getAppointmentById = async (req, res) => {
    const appointment = await Appointment.findByPk(req.resourceId, {
        include: withRelations,
    });

    if (!appointment) {
        throw appointmentNotFound();
    }

    res.json({ data: toAppointmentResponse(appointment), });
};

export const createAppointment = async (req, res) => {
    await validateReferences(req.dto);

    const appointment = await Appointment.create(req.dto);

    await appointment.reload({
        include: withRelations,
    });

    res.status(201).location(`/api/appointments/${appointment.id}`).json({ data: toAppointmentResponse(appointment), });
};

export const updateAppointment = async (req, res) => {
    const appointment = await Appointment.findByPk(req.resourceId);

    if (!appointment) {
        throw appointmentNotFound();
    }

    await validateReferences(req.dto);

    await appointment.update(req.dto);
    await appointment.reload({
        include: withRelations,
    });
    res.json({ data: toAppointmentResponse(appointment), });
};

export const deleteAppointment = async (req, res) => {
    const appointment = await Appointment.findByPk(req.resourceId);

    if (!appointment) {
        throw appointmentNotFound();
    }

    await appointment.destroy();

    res.status(204).end();
};
