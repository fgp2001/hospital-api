import { sequelize } from "../src/models/index.js";

try {
    console.log(`Synchronizing database: ${sequelize.getDatabaseName()}`);

    await sequelize.sync();

    console.log("Schema synchronized successfully");

} catch (error) {
    console.error("Unable to synchronize the schema");
    console.error(error);
    process.exitCode = 1;
} finally {
    await sequelize.close();
}