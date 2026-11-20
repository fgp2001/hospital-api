import { UniqueConstraintError, ForeignKeyConstraintError, ValidationError } from "sequelize";

export const errorHandler = (error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }

    if (error.type === "entity.parse.failed") {
        return res.status(400).json({
            error: {
                code: "INVALID_JSON",
                message: "Request body is not valid JSON",
            },
        });
    }

    if (error instanceof UniqueConstraintError) {
        const fields = Object.keys(error.fields ?? {});

        if (
            fields.includes("document_number") ||
            fields.includes("documentNumber")
        ) {
            return res.status(409).json({
                error: {
                    code: "DOCUMENT_NUMBER_TAKEN",
                    message: "Document number is already registered",
                },
            });
        }

        if (
            fields.includes("license_number") ||
            fields.includes("licenseNumber")
        ) {
            return res.status(409).json({
                error: {
                    code: "LICENSE_NUMBER_TAKEN",
                    message: "License number is already registered",
                },
            });
        }
    }
    if (error instanceof UniqueConstraintError) {
        return res.status(409).json({
            error: {
                code: "EMAIL_TAKEN",
                message: "Email is already registered",
            },
        });
    }

    if (error instanceof ValidationError) {
        return res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message: "Invalid user data",
                details: error.errors.map((item) => item.message),
            },
        });
    }

    if (error instanceof ForeignKeyConstraintError) {
        return res.status(400).json({
            error: {
                code: "INVALID_REFERENCE",
                message: "Referenced resource does not exist",
            },
        });
    }

    const status = error.status ?? 500;

    if (status >= 500) {
        console.error(error);
    }

    res.status(status).json({
        error: {
            code: error.code ?? "INTERNAL_ERROR",
            message: status >= 500
                ? "Unexpected server error"
                : error.message,
            ...(error.details ? { details: error.details } : {}),
        },
    });
};