import jwt from "jsonwebtoken";

const JWT_ISSUER = "hospital-api";
const JWT_AUDIENCE = "hospital-clients";

function getJwtSecret() {
    const secret = process.env.JWT_SECRET;

    if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
        throw new Error("JWT_SECRET must be configured with at least 32 bytes");
    }

    return secret;
}

export function issueAccessToken(user) {
    return jwt.sign(
        {
            role: user.role,
        },
        getJwtSecret(),
        {
            algorithm: "HS256",
            subject: String(user.id),
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
            expiresIn: "15m",
        }
    );
}


export function verifyAccessToken(token) {
    return jwt.verify(token, getJwtSecret(), {
        algorithms: ["HS256"],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
    });
}
