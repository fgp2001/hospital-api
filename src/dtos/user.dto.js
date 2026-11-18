import * as yup from "yup";

const name = yup.string().trim().min(2).max(120);
const email = yup.string().trim().lowercase().email().max(255);

const password = yup.string().trim().min(8).max(72).test(
    "bcrypt-max-bytes",
    "Password must be at most 72 bytes",
    (value) => !value || Buffer.byteLength(value, "utf8") <= 72
);

const role = yup
    .string()
    .oneOf(
        ["ROLE_USER", "ROLE_ADMIN"],
        "Role must be ROLE_USER or ROLE_ADMIN"
    );

export const createUserDTO = yup
    .object({
        name: name.required(),
        email: email.required(),
        password : password.required(),
    })
    .noUnknown(true, "Unknown fields are not allowed");

export const updateUserDTO = yup
    .object({ name, email, password })
    .noUnknown(true, "Unknown fields are not allowed")
    .test(
        "at-least-one",
        "At least one field is required",
        (value) => Object.keys(value ?? {}).length > 0
    );

export const assignRoleDTO = yup
    .object({
        role: role.required(),
    })
    .noUnknown(true, "Unknown fields are not allowed");

export function toUserResponse(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };
}