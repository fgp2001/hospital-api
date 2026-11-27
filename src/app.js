import express from "express";
import cors from "cors";
import swaggerUiDist from "swagger-ui-dist";
import helmet from "helmet";
import { loginLimiter } from "./middlewares/login-rate-limit.middleware.js"
import { fileURLToPath } from "node:url";
import { authenticate, authorize } from "./middlewares/auth.middleware.js";
import { authorizeByMethod } from "./middlewares/authorize-by-method.middleware.js";
import { userRouter } from "./routes/user.routes.js";
import { notFoundHandler } from "./middlewares/not-found.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { authRouter } from "./routes/auth.routes.js";
import { patientRouter } from "./routes/patient.routes.js";
import { specialtyRouter } from "./routes/specialty.routes.js";
import { doctorRouter } from "./routes/doctor.routes.js";
import { nurseRouter } from "./routes/nurse.routes.js";
import { appointmentRouter } from "./routes/appointment.routes.js"

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        upgradeInsecureRequests:
          process.env.NODE_ENV === "production" ? [] : null,
      },
    },
  })
  );

  const corsOrigins = (
    process.env.CORS_ORIGIN ?? "http://localhost:5173"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(cors({ origin: corsOrigins }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok" });
  });

  const openApiPath = fileURLToPath(
    new URL("../docs/openapi.yaml", import.meta.url)
  );

  const swaggerInitPath = fileURLToPath(
    new URL("../docs/swagger-init.js", import.meta.url)
  );

  app.use(
    "/docs/assets",
    express.static(swaggerUiDist.absolutePath(), {
      index: false,
    })
  );

  app.get("/docs/swagger-init.js", (req, res) => {
    res.type("application/javascript").sendFile(swaggerInitPath);
  });

  app.get("/docs", (req, res) => {
    res.type("html").send(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Hospital API - Documentación</title>
    <link
      rel="stylesheet"
      href="/docs/assets/swagger-ui.css"
    />
  </head>

  <body>
    <div id="swagger-ui"></div>

    <script src="/docs/assets/swagger-ui-bundle.js"></script>

    <script src="/docs/assets/swagger-ui-bundle.js"></script>
    <script src="/docs/swagger-init.js"></script>
  </body>
</html>`);
  });

  app.get("/openapi.yaml", (req, res) => {
    res.type("application/yaml").sendFile(openApiPath);
  });

  const ALL_ROLES = ["ADMIN", "DOCTOR", "RECEPTIONIST"];

  app.use("/api/auth/login", loginLimiter)
  app.use("/api/auth", authRouter);
  app.use("/api/users", authenticate, authorize("ADMIN"), userRouter);
  app.use("/api/patients", authenticate, authorizeByMethod({
    GET: ALL_ROLES, POST: ["ADMIN", "RECEPTIONIST"], PATCH: ["ADMIN", "RECEPTIONIST"], DELETE: ["ADMIN"]
  }), patientRouter);
  app.use("/api/specialties", authenticate, authorizeByMethod({ GET: "ALL_ROLES" }), specialtyRouter);
  app.use("/api/doctors", authenticate, authorizeByMethod({
    GET: ALL_ROLES, POST: ["ADMIN"], PATCH: ["ADMIN"], DELETE: ["ADMIN"]
  }), doctorRouter);
  app.use("/api/nurses", authenticate, authorizeByMethod({
    GET: ALL_ROLES, POST: ["ADMIN"], PATCH: ["ADMIN"], DELETE: ["ADMIN"]
  }), nurseRouter);
  app.use("/api/appointments", authenticate, authorizeByMethod({
    GET: ALL_ROLES, POST: ALL_ROLES, PATCH: ALL_ROLES, DELETE: ["ADMIN"]
  }), appointmentRouter);


  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
