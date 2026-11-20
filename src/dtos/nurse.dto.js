import * as yup from "yup";

const firstName = yup.string().trim().min(2).max(120);
const lastName = yup.string().trim().min(2).max(120);
const licenseNumber = yup.string().trim().min(4).max(20);

export const createNurseDto = yup.object({
    firstName: firstName.required(),
    lastName: lastName.required(),
    licenseNumber: licenseNumber.required(),
}).noUnknown(true, "Unknown fields are not allowed");

export const updateNurseDto = yup.object({
    firstName,
    lastName,
    licenseNumber,
}).noUnknown(true, "Unknown fields are not allowed")
    .test("at-least-one",
        "At least one field is required",
        (value) => Object.keys(value ?? {}).length > 0);


export function toNurseResponse(nurse) {
    return {
        id: nurse.id,
        firstName: nurse.firstName,
        lastName: nurse.lastName,
        licenseNumber: nurse.licenseNumber,
    };
}