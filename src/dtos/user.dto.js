import * as yup from "yup";

const name = yup.string().trim().min(2).max(120);
const email = yup.string().trim().lowercase().email().max(255);

export const createUserDTO = yup
    .object({
        name: name.required(),
        email: email.required(),
    })
    .noUnknown(true, "Unknown fields are not allowed");

export const updateUserDTO = yup
    .object({ name, email })
    .noUnknown(true, "Unknown fields are not allowed")
    .test(
        "at-least-one",
        "At least one field is required",
        (value) => Object.keys(value ?? {}).length > 0
    );

export function toUserResponse(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
    };
}