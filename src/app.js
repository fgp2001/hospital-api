import express from "express";
import cors from "cors";
import swaggerUiDist from "swagger-ui-dist";
import { fileURLToPath } from "node:url";
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

  app.use(
    "/docs/assets",
    express.static(swaggerUiDist.absolutePath(), {
      index: false,
    })
  );
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

    <script>
      SwaggerUIBundle({
        url: "/openapi.yaml",
        dom_id: "#swagger-ui",
        deepLinking: true,
        displayRequestDuration: true
      });
    </script>
  </body>
</html>`);
  });

  app.get("/openapi.yaml", (req, res) => {
    res.type("application/yaml").sendFile(openApiPath);
  });

  app.use("/api/users", userRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/patients", patientRouter);
  app.use("/api/specialties", specialtyRouter);
  app.use("/api/doctors", doctorRouter);
  app.use("/api/nurses", nurseRouter);
  app.use("/api/appointments", appointmentRouter);


  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

