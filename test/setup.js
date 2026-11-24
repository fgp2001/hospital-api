import { sequelize } from "../src/models/index.js";

export async function prepareTestDatabase() {
    const configuredDatabase = sequelize.getDatabaseName();


    if (process.env.NODE_ENV !== "test" || process.env.DB_NAME !== "hospital_test" || configuredDatabase !== "hospital_test") {
        throw new Error("Tests blocked: the database must be hospital_test");
    }

    await sequelize.authenticate();

    const [rows] = await sequelize.query(
        "SELECT current_database() AS database_name"
    );

    if (rows[0]?.database_name !== "hospital_test") {
        throw new Error("Tests blocked: connected to the wrong database");
    }

    console.log("Connected to hospital_test");

    await sequelize.query(`
        DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'user_role'
      ) THEN
        CREATE TYPE user_role AS ENUM (
          'ROLE_USER',
          'ROLE_ADMIN'
        );
      END IF;
    END
    $$;
  `);


    await sequelize.sync({
        force: true,
        match: /^hospital_test$/,
    });

    console.log("Test schema initialized");
}

export async function cleanTestDatabase() {
    await sequelize.truncate({
        cascade: true,
        restartIdentity: true,
    });
}