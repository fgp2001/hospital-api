import { User } from "../models/index.js";
import { verifyAccessToken } from "../utils/jwt.js";

function authenticationError(code, message) {
    return {
        error: {
            code: code,
            message: message,
        },
    }
};

export const authenticate = async (req, res, next) => {
    const authorization = req.get("authorization") ?? "";
    const match = /^Bearer\s+(\S+)$/i.exec(authorization);

    if (!match) {
        return res.status(401).json(authenticationError("UNAUTHENTICATED", "Authentication token is required"));
    }

    let payload;

    try {
        payload = verifyAccessToken(match[1]);
    } catch {
        return res.status(401).json(authenticationError("INVALID_TOKEN", "Invalid or expired token"));
    }

    try {
        const userId = Number(payload.sub);

        if (!Number.isSafeInteger(userId) || userId <= 0) {
            return res.status(401).json(authenticationError("INVALID_TOKEN", "Invalid or expired token"));
        }
        const user = await User.findByPk(userId);

        if (!user || !user.isActive) {
            return res.status(401).json(authenticationError("UNAUTHENTICATED", "Authentication token is no longer active"));
        }

        req.auth = {
            ...payload,
            role: user.role,
        };

        req.authUser = user;

        return next();

    } catch (error) {
        return next(error);
    }
};

export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.auth || !allowedRoles.includes(req.auth.role)) {
            return res.status(403).json({
                error: {
                    code: "FORBIDDEN",
                    message: "Insufficient permissions for this resources"
                },
            });
        }

        return next();
    };
};


