import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

export class Appointment extends Model { }

Appointment.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        patientId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "patient_id",
            references: {
                model: "patients",
                key: "id",
            },
        },

        doctorId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: "doctor_id",
            references: {
                model: "doctors",
                key: "id",
            },
        },

        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            validate: {
                isDate: {
                    msg: "Date must be a valid date (YYYY-MM-DD)",
                },
            },
        },

        reason: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: "Reason cannot be empty",
                },
                len: {
                    args: [3, 255],
                    msg: "Reason must be between 3 and 255 characters",
                },
            },
        },
    },

    {
        sequelize,
        modelName: "Appointment",
        tableName: "appointments",
        underscored: true,
        timestamps: true,
        indexes: [
            { fields: ["patient_id"] },
            { fields: ["doctor_id"] },
            { fields: ["date"] },
        ],
    }
);