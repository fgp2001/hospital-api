import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../src/models/user.model.js"
import { issueAccessToken, verifyAccessToken } from "../src/utils/jwt.js";
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";

import { createApp } from "../src/app.js";
import { sequelize, Specialty } from "../src/models/index.js";

import {
    prepareTestDatabase,
    cleanTestDatabase,
} from "./setup.js";

const app = createApp();
let databaseReady = false;
let adminToken;
let doctorToken;
let receptionistToken;
let adminId;

// Antes de comenzar la suite
before(async () => {
    await prepareTestDatabase();
    databaseReady = true;

    //Exclusiva para test
    const passwordHash = await bcrypt.hash("TestPassword2026!", 12);

    //Usuario ADMIN
    const admin = await User.create({
        name: "Admin Test",
        email: "admin@test.local",
        password: passwordHash,
        role: "ADMIN",
        isActive: true,
    });
    //Usuario DOCTOR
    const doctor = await User.create({
        name: "Doctor Test",
        email: "doctor@test.local",
        password: passwordHash,
        role: "DOCTOR",
        isActive: true
    });
    //Usuario RECEPTIONIST
    const receptionist = await User.create({
        name: "Receptionist Test",
        email: "receptionist@test.local",
        password: passwordHash,
        role: "RECEPTIONIST",
        isActive: true
    });

    adminId = admin.id;

    adminToken = issueAccessToken(admin);
    doctorToken = issueAccessToken(doctor);
    receptionistToken = issueAccessToken(receptionist)
});

// Al finalizar, limpiar y cerrar conexiones
after(async () => {
    try {
        if (databaseReady) {
            await cleanTestDatabase();
        }
    } finally {
        await sequelize.close();
    }
});

const api = {
    get: (path) =>
        request(app)
            .get(path)
            .set("Authorization", `Bearer ${adminToken}`),
    post: (path) =>
        request(app)
            .post(path)
            .set("Authorization", `Bearer ${adminToken}`),
    patch: (path) => 
        request(app)
            .patch(path)
            .set("Authorization", `Bearer ${adminToken}`),
    delete: (path) =>
        request(app)
            .delete(path)
            .set("Authorization", `Bearer ${adminToken}`),
};

// TEST 1 - Health
test("GET /api/health responde 200", async () => {
    const response = await api
        .get("/api/health")
        .expect(200);

    assert.equal(response.body.status, "ok");
});

// TEST 2 - Regresión de Users
test("GET /api/users sigue funcionando", async () => {
    const response = await api
        .get("/api/users")
        .expect(200);

    assert.ok(Array.isArray(response.body.data));
});

// TEST 3 - CRUD de pacientes
test("Crear, consultar, actualizar y eliminar paciente", async () => {
    const patientData = {
        firstName: "Ada",
        lastName: "Lovelace",
        documentNumber: "30111222",
        birthDate: "1985-12-10",
    };

    // Crear
    const created = await api
        .post("/api/patients")
        .send(patientData)
        .expect(201);

    const id = created.body.data.id;

    assert.match(
        created.headers.location,
        /^\/api\/patients\/\d+$/
    );

    // Verificar el DTO de salida
    assert.deepEqual(
        Object.keys(created.body.data).sort(),
        [
            "id",
            "firstName",
            "lastName",
            "documentNumber",
            "birthDate",
        ].sort()
    );

    // Consultar
    const found = await api
        .get(`/api/patients/${id}`)
        .expect(200);

    assert.equal(found.body.data.id, id);

    // Actualizar parcialmente
    const updated = await api
        .patch(`/api/patients/${id}`)
        .send({ lastName: "Byron" })
        .expect(200);

    assert.equal(updated.body.data.lastName, "Byron");
    assert.equal(updated.body.data.firstName, "Ada");

    // Eliminar
    await api
        .delete(`/api/patients/${id}`)
        .expect(204);

    // Comprobar que ya no existe
    const deleted = await api
        .get(`/api/patients/${id}`)
        .expect(404);

    assert.equal(
        deleted.body.error.code,
        "PATIENT_NOT_FOUND"
    );
});

// TEST 4 - Documento duplicado
test("Documento duplicado devuelve 409", async () => {
    const patientData = {
        firstName: "Juan",
        lastName: "Perez",
        documentNumber: "30222333",
        birthDate: "1990-05-10",
    };

    await api
        .post("/api/patients")
        .send(patientData)
        .expect(201);

    const response = await api
        .post("/api/patients")
        .send(patientData)
        .expect(409);   

    assert.equal(
        response.body.error.code,
        "DOCUMENT_NUMBER_TAKEN"
    );
});

// TEST 5 - Body incompleto
test("Body inválido devuelve 400", async () => {
    const response = await api
        .post("/api/patients")
        .send({ firstName: "A" })
        .expect(400);

    assert.equal(
        response.body.error.code,
        "VALIDATION_ERROR"
    );

    assert.ok(
        Array.isArray(response.body.error.details)
    );
});

// TEST 6 - ID inválido
test("ID no numérico devuelve 400", async () => {
    const response = await api
        .get("/api/patients/abc")
        .expect(400);

    assert.equal(
        response.body.error.code,
        "INVALID_ID"
    );
});

// TEST 7 - Recurso inexistente
test("Paciente inexistente devuelve 404", async () => {
    const response = await api
        .get("/api/patients/999999")
        .expect(404);

    assert.equal(
        response.body.error.code,
        "PATIENT_NOT_FOUND"
    );
});


test("Doctors: CRUD, especialidad y errores", async () => {
    const specialty = await Specialty.create({
        name: "Especialidad de pruebas",
    });

    const doctorData = {
        firstName: "Gregory",
        lastName: "House",
        licenseNumber: "MN-TEST-001",
        specialtyId: specialty.id,
    };

    // Crear médico
    const created = await api
        .post("/api/doctors")
        .send(doctorData)
        .expect(201);

    const id = created.body.data.id;

    assert.match(
        created.headers.location,
        /^\/api\/doctors\/\d+$/
    );

    // La especialidad debe estar anidada
    assert.deepEqual(created.body.data.specialty, {
        id: specialty.id,
        name: specialty.name,
    });

    assert.equal(created.body.data.specialtyId, undefined);
    assert.equal(created.body.data.createdAt, undefined);

    // Obtener por ID
    const found = await api
        .get(`/api/doctors/${id}`)
        .expect(200);

    assert.equal(found.body.data.id, id);
    assert.equal(found.body.data.specialty.id, specialty.id);

    // Buscar por apellido
    const search = await api
        .get("/api/doctors/search?keywords=HOUSE")
        .expect(200);

    assert.ok(search.body.data.some((d) => d.id === id));

    // Matrícula duplicada
    const duplicated = await api
        .post("/api/doctors")
        .send(doctorData)
        .expect(409);

    assert.equal(
        duplicated.body.error.code,
        "LICENSE_NUMBER_TAKEN"
    );

    // Especialidad inexistente
    const invalidReference = await api
        .post("/api/doctors")
        .send({
            ...doctorData,
            licenseNumber: "MN-TEST-002",
            specialtyId: 999999,
        })
        .expect(400);

    assert.equal(
        invalidReference.body.error.code,
        "INVALID_REFERENCE"
    );

    // Actualización parcial
    const updated = await api
        .patch(`/api/doctors/${id}`)
        .send({ lastName: "House Jr." })
        .expect(200);

    assert.equal(updated.body.data.lastName, "House Jr.");
    assert.equal(updated.body.data.firstName, "Gregory");

    // Eliminar médico
    await api
        .delete(`/api/doctors/${id}`)
        .expect(204);

    // Ya no existe
    await api
        .get(`/api/doctors/${id}`)
        .expect(404);
});


test("Nurses: CRUD, búsqueda y matrícula única", async () => {
    const nurseData = {
        firstName: "Florence",
        lastName: "Nightingale",
        licenseNumber: "EN-TEST-001",
    };

    // Crear enfermero
    const created = await api
        .post("/api/nurses")
        .send(nurseData)
        .expect(201);

    const id = created.body.data.id;

    assert.deepEqual(
        Object.keys(created.body.data).sort(),
        ["id", "firstName", "lastName", "licenseNumber"].sort()
    );

    // Obtener por ID
    const found = await api
        .get(`/api/nurses/${id}`)
        .expect(200);

    assert.equal(found.body.data.id, id);

    // Búsqueda sin distinguir mayúsculas
    const search = await api
        .get("/api/nurses/search?keywords=NIGHTINGALE")
        .expect(200);

    assert.ok(search.body.data.some((n) => n.id === id));

    // Matrícula repetida
    const duplicated = await api
        .post("/api/nurses")
        .send(nurseData)
        .expect(409);

    assert.equal(
        duplicated.body.error.code,
        "LICENSE_NUMBER_TAKEN"
    );

    // Actualizar
    const updated = await api
        .patch(`/api/nurses/${id}`)
        .send({ firstName: "Florencia" })
        .expect(200);

    assert.equal(updated.body.data.firstName, "Florencia");

    // Eliminar
    await api
        .delete(`/api/nurses/${id}`)
        .expect(204);

    // Comprobar eliminación
    await api
        .get(`/api/nurses/${id}`)
        .expect(404);
});



test("Appointments: relaciones, filtros y restricciones", async () => {
    // Preparar especialidad
    const specialty = await Specialty.create({
        name: "Cardiología Test",
    });

    // Crear dos pacientes
    const patientA = await api
        .post("/api/patients")
        .send({
            firstName: "Ada",
            lastName: "Lovelace",
            documentNumber: "40111222",
            birthDate: "1985-12-10",
        })
        .expect(201);

    const patientB = await api
        .post("/api/patients")
        .send({
            firstName: "Alan",
            lastName: "Turing",
            documentNumber: "40111223",
            birthDate: "1990-05-10",
        })
        .expect(201);

    const patientAId = patientA.body.data.id;
    const patientBId = patientB.body.data.id;

    // Crear dos médicos
    const doctorA = await api
        .post("/api/doctors")
        .send({
            firstName: "Gregory",
            lastName: "House",
            licenseNumber: "MN-TEST-101",
            specialtyId: specialty.id,
        })
        .expect(201);

    const doctorB = await api
        .post("/api/doctors")
        .send({
            firstName: "James",
            lastName: "Wilson",
            licenseNumber: "MN-TEST-102",
            specialtyId: specialty.id,
        })
        .expect(201);

    const doctorAId = doctorA.body.data.id;
    const doctorBId = doctorB.body.data.id;

    // Dos appointments para Ada
    const appointment1 = await api
        .post("/api/appointments")
        .send({
            patientId: patientAId,
            doctorId: doctorAId,
            date: "2026-11-20",
            reason: "Control de presión arterial",
        })
        .expect(201);

    const appointment2 = await api
        .post("/api/appointments")
        .send({
            patientId: patientAId,
            doctorId: doctorAId,
            date: "2026-11-22",
            reason: "Control de seguimiento",
        })
        .expect(201);

    // Un appointment para Alan
    const appointment3 = await api
        .post("/api/appointments")
        .send({
            patientId: patientBId,
            doctorId: doctorBId,
            date: "2026-11-20",
            reason: "Consulta general",
        })
        .expect(201);

    const ids = [
        appointment1.body.data.id,
        appointment2.body.data.id,
        appointment3.body.data.id,
    ];

    // Consultar una cita por ID
    const detail = await api
        .get(`/api/appointments/${ids[0]}`)
        .expect(200);

    assert.equal(detail.body.data.id, ids[0]);
    assert.equal(detail.body.data.date, "2026-11-20");
    assert.equal(
        detail.body.data.reason,
        "Control de presión arterial"
    );

    assert.equal(
        detail.body.data.patient.id,
        patientAId
    );

    assert.equal(
        detail.body.data.doctor.id,
        doctorAId
    );

    // Fecha con formato inválido
    const invalidDate = await api
        .get("/api/appointments/search?date=20-11-2026")
        .expect(400);

    assert.equal(
        invalidDate.body.error.code,
        "VALIDATION_ERROR"
    );

    // Verificar respuesta anidada
    const created = appointment1.body.data;

    assert.equal(created.date, "2026-11-20");
    assert.equal(created.reason, "Control de presión arterial");
    assert.equal(created.patient.id, patientAId);
    assert.equal(created.doctor.id, doctorAId);

    assert.equal(created.patientId, undefined);
    assert.equal(created.doctorId, undefined);
    assert.equal(created.createdAt, undefined);

    // Filtrar por paciente: exactamente dos
    const byPatient = await api
        .get(`/api/appointments/search?patientId=${patientAId}`)
        .expect(200);

    assert.equal(byPatient.body.data.length, 2);

    // Filtrar por médico
    const byDoctor = await api
        .get(`/api/appointments/search?doctorId=${doctorBId}`)
        .expect(200);

    assert.equal(byDoctor.body.data.length, 1);
    assert.equal(byDoctor.body.data[0].id, ids[2]);

    // Filtrar por fecha: exactamente dos
    const byDate = await api
        .get("/api/appointments/search?date=2026-11-20")
        .expect(200);

    assert.equal(byDate.body.data.length, 2);

    // Filtros combinados
    const combined = await api
        .get(
            `/api/appointments/search?patientId=${patientAId}&date=2026-11-20`
        )
        .expect(200);

    assert.equal(combined.body.data.length, 1);
    assert.equal(combined.body.data[0].id, ids[0]);

    // El listado debe estar ordenado por fecha
    const list = await api
        .get("/api/appointments")
        .expect(200);

    const dates = list.body.data.map((a) => a.date);

    assert.deepEqual(
        dates,
        [...dates].sort().reverse()
    );

    // Filtro inválido
    const invalidQuery = await api
        .get("/api/appointments/search?patientId=abc")
        .expect(400);

    assert.equal(
        invalidQuery.body.error.code,
        "VALIDATION_ERROR"
    );

    // Paciente inexistente
    const invalidReference = await api
        .post("/api/appointments")
        .send({
            patientId: 999999,
            doctorId: doctorAId,
            date: "2026-11-20",
            reason: "Consulta general",
        })
        .expect(400);

    assert.equal(
        invalidReference.body.error.code,
        "INVALID_REFERENCE"
    );

    // No se puede eliminar un paciente con citas
    const blockedPatient = await api
        .delete(`/api/patients/${patientAId}`)
        .expect(409);

    assert.equal(
        blockedPatient.body.error.code,
        "PATIENT_HAS_APPOINTMENTS"
    );

    // Tampoco se puede eliminar un médico con citas
    const blockedDoctor = await api
        .delete(`/api/doctors/${doctorAId}`)
        .expect(409);

    assert.equal(
        blockedDoctor.body.error.code,
        "DOCTOR_HAS_APPOINTMENTS"
    );

    // Eliminar las tres citas
    for (const id of ids) {
        await api
            .delete(`/api/appointments/${id}`)
            .expect(204);
    }

    // Comprobar que ya no existen
    await api
        .get(`/api/appointments/${ids[0]}`)
        .expect(404);

    // Ahora podemos eliminar pacientes y médicos
    await api
        .delete(`/api/patients/${patientAId}`)
        .expect(204);

    await api
        .delete(`/api/patients/${patientBId}`)
        .expect(204);

    await api
        .delete(`/api/doctors/${doctorAId}`)
        .expect(204);

    await api
        .delete(`/api/doctors/${doctorBId}`)
        .expect(204);
});


test("Patients: rechaza campos desconocidos", async () => {
    const response = await api
        .post("/api/patients")
        .send({
            firstName: "Ada",
            lastName: "Lovelace",
            documentNumber: "50111222",
            birthDate: "1985-12-10",
            campoDesconocido: "no permitido",
        })
        .expect(400);

    assert.equal(
        response.body.error.code,
        "VALIDATION_ERROR"
    );
});

test("Patients: PATCH vacío devuelve 400", async () => {
    const created = await api
        .post("/api/patients")
        .send({
            firstName: "Marie",
            lastName: "Curie",
            documentNumber: "50111223",
            birthDate: "1980-04-15",
        })
        .expect(201);

    const id = created.body.data.id;

    try {
        const response = await api
            .patch(`/api/patients/${id}`)
            .send({})
            .expect(400);

        assert.equal(
            response.body.error.code,
            "VALIDATION_ERROR"
        );
    } finally {
        await api
            .delete(`/api/patients/${id}`)
            .expect(204);
    }
});

test("Patients: listado ordenado por ID", async () => {
    const response = await api
        .get("/api/patients")
        .expect(200);

    assert.ok(Array.isArray(response.body.data));

    const ids = response.body.data.map(
        (patient) => Number(patient.id)
    );

    const sortedIds = [...ids].sort((a, b) => a - b);

    assert.deepEqual(ids, sortedIds);
});

test("Specialties: listado y detalle", async () => {
    const specialty = await Specialty.create({
        name: "Especialidad Test Final",
    });

    try {
        // Listado
        const list = await api
            .get("/api/specialties")
            .expect(200);

        assert.ok(Array.isArray(list.body.data));

        assert.ok(
            list.body.data.some(
                (item) => Number(item.id) === specialty.id
            )
        );

        // Detalle
        const found = await api
            .get(`/api/specialties/${specialty.id}`)
            .expect(200);

        assert.equal(found.body.data.id, specialty.id);
        assert.equal(
            found.body.data.name,
            specialty.name
        );

        // ID inválido
        await api
            .get("/api/specialties/abc")
            .expect(400);

        // Especialidad inexistente
        await api
            .get("/api/specialties/999999")
            .expect(404);
    } finally {
        await specialty.destroy();
    }
});


// TEST 15 - Login con JWT
test("Auth: login devuelve un JWT válido", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({
      email: "admin@test.local",
      password: "TestPassword2026!",
    })
    .expect(200);

  assert.equal(response.body.tokenType, "Bearer");
  assert.equal(response.body.expiresIn, 900);
  assert.ok(response.body.accessToken);

  const payload = verifyAccessToken(
    response.body.accessToken
  );

  assert.equal(payload.sub, String(adminId));
  assert.equal(payload.role, "ADMIN");
  assert.equal(payload.iss, "hospital-api");
  assert.equal(payload.aud, "hospital-clients");
});

// TEST 16 - Usuario autenticado
test("Auth: GET /me devuelve el perfil público", async () => {
  const response = await request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${adminToken}`)
    .expect(200);

  assert.equal(response.body.data.id, adminId);
  assert.equal(response.body.data.role, "ADMIN");

  // Nunca debe exponerse la contraseña
  assert.equal(response.body.data.password, undefined);
});

// TEST 17 - Sin token
test("Auth: sin token devuelve 401", async () => {
  const response = await request(app)
    .get("/api/patients")
    .expect(401);

  assert.equal(
    response.body.error.code,
    "UNAUTHENTICATED"
  );
});

// TEST 18 - Token inválido
test("Auth: token inválido devuelve 401", async () => {
  const response = await request(app)
    .get("/api/patients")
    .set("Authorization", "Bearer token.invalido.aqui")
    .expect(401);

  assert.equal(
    response.body.error.code,
    "INVALID_TOKEN"
  );
});

// TEST 19 - Token expirado
test("Auth: token expirado devuelve 401", async () => {
  const expiredToken = jwt.sign(
    { role: "ADMIN" },
    process.env.JWT_SECRET,
    {
      algorithm: "HS256",
      subject: String(adminId),
      issuer: "hospital-api",
      audience: "hospital-clients",
      expiresIn: -10,
    }
  );

  const response = await request(app)
    .get("/api/patients")
    .set("Authorization", `Bearer ${expiredToken}`)
    .expect(401);

  assert.equal(
    response.body.error.code,
    "INVALID_TOKEN"
  );
});

// TEST 20 - Autorización por roles
test("Auth: RECEPTIONIST puede consultar pero no eliminar", async () => {
  // El rol RECEPTIONIST puede consultar pacientes
  await request(app)
    .get("/api/patients")
    .set(
      "Authorization",
      `Bearer ${receptionistToken}`
    )
    .expect(200);

  // Pero no puede eliminar pacientes
  const response = await request(app)
    .delete("/api/patients/999999")
    .set(
      "Authorization",
      `Bearer ${receptionistToken}`
    )
    .expect(403);

  assert.equal(
    response.body.error.code,
    "FORBIDDEN"
  );

  // ADMIN sí puede acceder a la operación.
  // El paciente no existe, por eso responde 404.
  await request(app)
    .delete("/api/patients/999999")
    .set("Authorization", `Bearer ${adminToken}`)
    .expect(404);
});


test("Auth: DOCTOR no puede eliminar pacientes", async () => {
  // Puede consultar pacientes
  await request(app)
    .get("/api/patients")
    .set("Authorization", `Bearer ${doctorToken}`)
    .expect(200);

  // No puede eliminarlos
  const response = await request(app)
    .delete("/api/patients/999999")
    .set("Authorization", `Bearer ${doctorToken}`)
    .expect(403);

  assert.equal(response.body.error.code, "FORBIDDEN");
});

test("Auth: usuario inactivo no puede autenticarse", async () => {
  const password = "InactiveTest2026!";

  const inactiveUser = await User.create({
    name: "Inactive Test",
    email: "inactive@test.local",
    password: await bcrypt.hash(password, 12),
    role: "RECEPTIONIST",
    isActive: false,
  });

  // El login debe rechazarse
  const loginResponse = await request(app)
    .post("/api/auth/login")
    .send({
      email: inactiveUser.email,
      password,
    })
    .expect(401);

  assert.equal(
    loginResponse.body.error.code,
    "INVALID_CREDENTIALS"
  );

  // Incluso con un JWT válido, no puede acceder
  const token = issueAccessToken(inactiveUser);

  const meResponse = await request(app)
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${token}`)
    .expect(401);

  assert.equal(
    meResponse.body.error.code,
    "UNAUTHENTICATED"
  );
});

test("Auth: x-user-role no permite saltarse JWT", async () => {
  const response = await request(app)
    .patch("/api/users/999999/role")
    .set("x-user-role", "ADMIN")
    .send({ role: "ADMIN" })
    .expect(401);

  assert.equal(
    response.body.error.code,
    "UNAUTHENTICATED"
  );
});

test("Auth: credenciales incorrectas devuelven 401 uniforme", async () => {
  // Contraseña incorrecta
  const wrongPassword = await request(app)
    .post("/api/auth/login")
    .send({
      email: "admin@test.local",
      password: "IncorrectPassword2026!",
    })
    .expect(401);

  // Email inexistente
  const unknownEmail = await request(app)
    .post("/api/auth/login")
    .send({
      email: "unknown@test.local",
      password: "IncorrectPassword2026!",
    })
    .expect(401);

  assert.equal(
    wrongPassword.body.error.code,
    "INVALID_CREDENTIALS"
  );

  assert.equal(
    unknownEmail.body.error.code,
    "INVALID_CREDENTIALS"
  );

  // No debe revelar si falló el email o la contraseña
  assert.deepEqual(
    wrongPassword.body.error,
    unknownEmail.body.error
  );
});



