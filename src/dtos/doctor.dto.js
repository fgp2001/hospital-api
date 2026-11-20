import * as yup from "yup";

const firstName = yup.string().trim().min(2).max(120);
const lastName = yup.string().trim().min(2).max(120);
const licenseNumber = yup.string().trim().min(4).max(20);
const specialtyId = yup.number().integer().positive();

export const createDoctorDto = yup.object({
    firstName: firstName.required(),
    lastName: lastName.required(),
    licenseNumber: licenseNumber.required(),
    specialtyId: specialtyId.required(),
}).noUnknown(true, "Unknown fields are not allowed");

export const updateDoctorDto = yup.object({
    firstName,
    lastName,
    licenseNumber,
    specialtyId,
}).noUnknown(true, "Unknown fields are not allowed")
    .test("at-least-one",
        "At least one field is required",
        (value) => Object.keys(value ?? {}).length > 0);

export function toDoctorResponse(doctor) {
    return {
        id: doctor.id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        licenseNumber: doctor.licenseNumber,
        specialty: doctor.specialty ? {
            id: doctor.specialty.id,
            name: doctor.specialty.name,
        }
            : null,
    };
}