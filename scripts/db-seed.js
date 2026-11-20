import { sequelize, Specialty } from "../src/models/index.js";

const SPECIALITIES = [
    { name: "Cardiología" },
    { name: "Pediatría" },
    { name: "Clínica médica" },
    { name: "Diagnóstico clínico" },
    { name: "Traumatología" },
];

try {
    await Specialty.bulkCreate(SPECIALITIES, {
        ignoreDuplicates: true,

    });

    console.log("Specialties seeded succesfully");
} catch (error) {
    console.error("Unable to seed specialties");
    console.error(error)
    process.exitCode = 1;
} finally {
    await sequelize.close();

}