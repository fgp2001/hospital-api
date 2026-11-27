import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database.js";

export class User extends Model { }

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING(120),
            allowNull: false,
            validate: {
                notEmpty: { msg: "Name cannot be empty" },
                len: {
                    args: [2, 120],
                    msg: "Name must be between 2 and 120 characters",
                },
            },
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: {
                    msg: "Email must be a valid email address",
                },
            },
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },

        role: {
            type: "user_role",
            allowNull: false,
            defaultValue: "RECEPTIONIST",
            validate: {
                isIn: {
                    args: [["ADMIN", "DOCTOR", "RECEPTIONIST"]],
                    msg: "Invalid role",
                },
            },
        },

        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        sequelize,
        modelName: "User",
        tableName: "users",
        underscored: true,
        timestamps: true,
    }
);

