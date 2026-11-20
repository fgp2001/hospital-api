import { Op, ForeignKeyConstraintError } from "sequelize";
import { Doctor, Specialty } from "../models/index.js";
import { AppError } from "../errors/app-error.js";
import { toDoctorResponse } from "../dtos/doctor.dto.js";

const withSpecialty = {
    model: Specialty,
    as: "specialty",
    attributes: ["id", "name"],
};

const doctorNotFound = () =>
    new AppError("Doctor not found", {
        status: 404,
        code: "DOCTOR_NOT_FOUND",
    });

const validateSpecialtyExists = async (specialtyId) => {
    const specialty = await Specialty.findByPk(specialtyId);

    if (!specialty) {
        throw new AppError("Referenced resource does not exist", {
            status: 400,
            code: "INVALID_REFERENCE",
        });
    }
};

export const listDoctors = async (req, res) => {
    const doctors = await Doctor.findAll({
        include: [withSpecialty],
        order: [["id", "ASC"]],
    });

    res.json({
        data: doctors.map(toDoctorResponse),
    });
};

export const searchDoctors = async (req, res) => {
    const keywords = typeof req.query.keywords === "string"
        ? req.query.keywords.trim()
        : "";

    if (!keywords) {
        return res.json({ data: [] });
    }

    const pattern = `%${keywords}%`;

    const doctors = await Doctor.findAll({
        where: {
            [Op.or]: [
                { firstName: { [Op.iLike]: pattern } },
                { lastName: { [Op.iLike]: pattern } },
                { licenseNumber: { [Op.iLike]: pattern } },
            ],
        },
        include: [withSpecialty],
        order: [["id", "ASC"]],
    });

    res.json({ data: doctors.map(toDoctorResponse) });
};

export const getDoctorById = async (req, res) => {
    const doctor = await Doctor.findByPk(req.resourceId, {
        include: [withSpecialty],
    });

    if (!doctor) {
        throw doctorNotFound();
    }

    res.json({ data: toDoctorResponse(doctor), });
};

export const createDoctor = async (req, res) => {
    await validateSpecialtyExists(req.dto.specialtyId);

    const doctor = await Doctor.create(req.dto);

    await doctor.reload({
        include: [withSpecialty],
    });

    res.status(201).location(`/api/doctors/${doctor.id}`).json({ data: toDoctorResponse(doctor), });
};

export const updateDoctor = async (req, res) => {
    const doctor = await Doctor.findByPk(req.resourceId);

    if (!doctor) {
        throw doctorNotFound();
    }

    if (req.dto.specialtyId !== undefined) {
        await validateSpecialtyExists(req.dto.specialtyId)
    }

    await doctor.update(req.dto);
    await doctor.reload({
        include: [withSpecialty],
    });
    res.json({ data: toDoctorResponse(doctor), });
};

export const deleteDoctor = async (req, res) => {
    const doctor = await Doctor.findByPk(req.resourceId);

    if (!doctor) {
        throw doctorNotFound();
    }
    try {
        await doctor.destroy();
    } catch (error) {
        if (error instanceof ForeignKeyConstraintError) {
            throw new AppError(
                "Doctor has appointments and cannot be deleted", {
                status: 409,
                code: "DOCTOR_HAS_APPOINTMENTS",
            }
            );
        }
        throw error;
    }
    res.status(204).end();
};
