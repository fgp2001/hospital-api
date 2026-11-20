import * as yup from "yup";

const firstName = yup.string().trim().min(2).max(120);
const lastName = yup.string().trim().min(2).max(120);
const documentNumber = yup.string().trim().matches(/^[0-9]{7,10}$/,
    "Document number must contain 7 to 10 digits");

const birthDate = yup
    .string()
    .matches(
        /^\d{4}-\d{2}-\d{2}$/,
        "Birth date must be YYYY-MM-DD"
    )
    .test(
        "valid-date",
        "Birth date must be a valid date",
        (value) => {
            if (!value) return true;

            const date = new Date(`${value}T00:00:00Z`);

            return (
                !Number.isNaN(date.getTime()) &&
                date.toISOString().slice(0, 10) === value
            );
        }
    )
    .test(
        "past-date",
        "Birth date must be in the past",
        (value) =>
            !value || value < new Date().toISOString().slice(0, 10)
    );

export const createPatientDto = yup.object({
    firstName: firstName.required(),
    lastName: lastName.required(),
    documentNumber: documentNumber.required(),
    birthDate: birthDate.required(),
}).noUnknown(true, "Unknown fields are not allowed");

export const updatePatientDto = yup.object({
    firstName,
    lastName,
    documentNumber,
    birthDate,
}).noUnknown(true, "Unknown fields are not allowed")
    .test("at-least-one",
        "At least one field is required",
        (value) => Object.keys(value ?? {}).length > 0);

export function toPatientResponse(patient) {
    return {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        documentNumber: patient.documentNumber,
        birthDate: patient.birthDate,
    };
}

