import * as yup from "yup";

const positiveId = yup.number().typeError("Must be a positive integer").integer().positive().max(Number.MAX_SAFE_INTEGER);

function isValidISODate(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }
    const date = new Date(`${value}T00:00:00Z`);

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
}

const date = yup.string().test("valid-date",
    "Date must be a valid date (YYYY-MM-DD)",
    (value) => value == null || isValidISODate(value));

const reason = yup.string().trim().min(3).max(255);

export const createAppointmentDto = yup.object({
    patientId: positiveId.required(),
    doctorId: positiveId.required(),
    date: date.required(),
    reason: reason.required(),
}).noUnknown(true, "Unknown fields are not allowed");

export const updateAppointmentDto = yup.object({
    patientId: positiveId,
    doctorId: positiveId,
    date,
    reason,
}).noUnknown(true, "Unknown fields are not allowed")
    .test("at-least-one",
        "At least one field is required",
        (value) => Object.keys(value ?? {}).length > 0);

export const searchAppointmentDto = yup.object({
    patientId: positiveId,
    doctorId: positiveId,
    date,
}).noUnknown(true, "Unknown query parameters are not allowed");

export function toAppointmentResponse(appointment) {
    return {
        id: appointment.id,
        date: appointment.date,
        reason: appointment.reason,

        patient: appointment.patient ? {
            id: appointment.patient.id,
            firstName: appointment.patient.firstName,
            lastName: appointment.patient.lastName
        }
            : null,

        doctor: appointment.doctor ? {
            id: appointment.doctor.id,
            firstName: appointment.doctor.firstName,
            lastName: appointment.doctor.lastName
        }
            : null,
    };
}
