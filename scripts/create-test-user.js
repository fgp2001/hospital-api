import bcrypt from "bcrypt";
import { sequelize } from "../src/config/database.js";
import { User } from "../src/models/user.model.js";

try {
    const [rows] = await sequelize.query("SELECT current_database() AS name");

    if (rows[0].name !== "nodepgdb") {
        throw new Error("La base debe ser nodepgdb, no " + rows[0].name);
    }

    const email = "admin.test@hospital.local";

    const existingUser = await User.findOne({ where: { email } },);

    if (existingUser) {
        console.log("El usuario ya existe:", email);
    } else {
        const passwordHash = await bcrypt.hash("AdminTest2026!", 12);
        const user = await User.create({
            name: "Admin Test",
            email,
            password: passwordHash,
            role: "ADMIN",
            isActive: true,
        });

        console.log("Usuario creado correctamente");
        console.log({
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
        });
    }

} catch (error) {
    console.error("Error al crear el usuario:", error.message);
    process.exitCode = 1;
} finally {
    await sequelize.close();
}