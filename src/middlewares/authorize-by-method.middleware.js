import { authorize } from "./auth.middleware.js";

export const authorizeByMethod = (permissions) => {
    return (req, res, next) => {
        const allowedRoles = permissions[req.method];

        if (!allowedRoles) {
            return res.status(403).json({
                error: {
                    code: "FORBIDDEN",
                    message: "Method not permitted for this resource",
                },
            });
        }

        return authorize(...allowedRoles)(req, res, next);
    };
};