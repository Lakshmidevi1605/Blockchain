const Prescription = require("../models/Prescription");
const User = require("../models/User");
const Block = require("../models/Block");
const AuditLog = require("../models/AuditLog");

const {
  createNextBlock,
  verifyBlock,
} = require("../utils/blockchain");

const {
  analyzePrescription,
} = require("../utils/aiAnalysis");

const {
  generatePrescriptionId,
  generateQrToken,
} = require("../utils/idGenerator");

const {
  generatePrescriptionQR,
} = require("../utils/qr");

const mongoose = require("mongoose");

async function findPatient(idOrRegId) {
  const conditions = [{ registrationId: idOrRegId }];
  if (mongoose.isValidObjectId(idOrRegId)) conditions.push({ _id: idOrRegId });
  return User.findOne({ $or: conditions, role: "patient" });
}

async function createPrescription(req, res) {
  try {
    const {
      patientId,
      diagnosis,
      medicines,
      instructions,
    } = req.body;

    if (!patientId) {
      return res.status(400).json({
        message: "Patient ID is required",
      });
    }

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({
        message: "At least one medicine is required",
      });
    }

    const patient = await findPatient(patientId);

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    const previousPrescriptions = await Prescription.find({
      patient: patient._id,
    })
      .sort({ createdAt: -1 })
      .limit(20);

    const previousMedicines = [];

    const previousDiagnoses = [];

    for (const prescription of previousPrescriptions) {
      if (prescription.diagnosis) {
        previousDiagnoses.push(prescription.diagnosis);
      }

      for (const medicine of prescription.medicines) {
        previousMedicines.push(medicine.name);
      }
    }

    const aiAnalysis = analyzePrescription({
      diagnosis,
      newMedicines: medicines,
      previousMedicines,
      previousDiagnoses,
    });

    const prescriptionId = generatePrescriptionId();

    const qrToken = generateQrToken();

    const prescription = await Prescription.create({
      prescriptionId,
      doctor: req.user.id,
      patient: patient._id,
      diagnosis: diagnosis || "",
      medicines,
      instructions: instructions || "",
      aiAnalysis: {
        summary: aiAnalysis.summary,
        warnings: aiAnalysis.warnings,
      },
      previousMedicinesSnapshot: previousMedicines,
      qrToken,
      status: "active",
    });

    const blockData = {
      type: "PRESCRIPTION",
      prescriptionId: prescription.prescriptionId,
      patientId: patient.registrationId,
      doctorId: req.user.registrationId,
      diagnosis: prescription.diagnosis,
      medicines: prescription.medicines.map((medicine) => ({
        name: medicine.name,
        dosage: medicine.dosage,
        duration: medicine.duration,
        frequency: medicine.frequency,
      })),
      issuedAt: prescription.createdAt,
    };

    const previousBlock = await Block.findOne().sort({
      index: -1,
    });

    const newBlock = createNextBlock(
      blockData,
      previousBlock
    );

    await Block.create(newBlock);

    prescription.blockchain = {
      blockIndex: newBlock.index,
      blockHash: newBlock.hash,
    };

    await prescription.save();

    const qrData = {
      prescriptionId: prescription.prescriptionId,
      qrToken: prescription.qrToken,
      blockHash: newBlock.hash,
    };

    const qrCode = await generatePrescriptionQR(qrData);

    await AuditLog.create({
      actor: req.user.id,
      action: "PRESCRIPTION_CREATED",
      target: prescription.prescriptionId,
      details: {
        patient: patient.registrationId,
        blockIndex: newBlock.index,
      },
      result: "success",
    });

    const populated = await Prescription.findById(
      prescription._id
    )
      .populate(
        "doctor",
        "registrationId name specialization licenseNumber"
      )
      .populate(
        "patient",
        "registrationId name dateOfBirth"
      );

    res.status(201).json({
      message: "Prescription created successfully",
      prescription: populated,
      aiAnalysis,
      blockchain: {
        blockIndex: newBlock.index,
        blockHash: newBlock.hash,
      },
      qrCode,
    });
  } catch (error) {
    console.error("[prescription:create]", error);

    res.status(500).json({
      message: "Failed to create prescription",
      error: error.message,
    });
  }
}

async function getDoctorPrescriptions(req, res) {
  try {
    const prescriptions = await Prescription.find({
      doctor: req.user.id,
    })
      .populate(
        "patient",
        "registrationId name dateOfBirth"
      )
      .sort({ createdAt: -1 });

    res.json({
      prescriptions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch prescriptions",
      error: error.message,
    });
  }
}

async function getPatientHistory(req, res) {
  try {
    const { patientId } = req.params;

    const patient = await findPatient(patientId);

    if (!patient) {
      return res.status(404).json({
        message: "Patient not found",
      });
    }

    const prescriptions = await Prescription.find({
      patient: patient._id,
    })
      .populate(
        "doctor",
        "registrationId name specialization licenseNumber"
      )
      .sort({ createdAt: -1 });

    res.json({
      patient,
      prescriptions,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch patient history",
      error: error.message,
    });
  }
}

async function getMyPrescriptions(req, res) {
  try {
    const prescriptions = await Prescription.find({
      patient: req.user.id,
    })
      .populate(
        "doctor",
        "registrationId name specialization licenseNumber"
      )
      .sort({ createdAt: -1 });

    const result = [];

    for (const prescription of prescriptions) {
      const qrCode = await generatePrescriptionQR({
        prescriptionId: prescription.prescriptionId,
        qrToken: prescription.qrToken,
        blockHash:
          prescription.blockchain?.blockHash || "",
      });

      result.push({
        ...prescription.toObject(),
        qrCode,
      });
    }

    res.json({
      prescriptions: result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch your prescriptions",
      error: error.message,
    });
  }
}

async function getPrescriptionById(req, res) {
  try {
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findOne({
      prescriptionId,
    })
      .populate(
        "doctor",
        "registrationId name specialization licenseNumber"
      )
      .populate(
        "patient",
        "registrationId name dateOfBirth"
      );

    if (!prescription) {
      return res.status(404).json({
        message: "Prescription not found",
      });
    }

    if (
      req.user.role === "patient" &&
      String(prescription.patient._id) !== String(req.user.id)
    ) {
      return res.status(403).json({
        message: "You can only view your own prescriptions",
      });
    }

    const qrCode = await generatePrescriptionQR({
      prescriptionId: prescription.prescriptionId,
      qrToken: prescription.qrToken,
      blockHash:
        prescription.blockchain?.blockHash || "",
    });

    res.json({
      prescription,
      qrCode,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch prescription",
      error: error.message,
    });
  }
}

async function verifyPrescription(req, res) {
  try {
    const {
      prescriptionId,
      qrToken,
    } = req.body;

    if (!prescriptionId || !qrToken) {
      return res.status(400).json({
        message: "Prescription ID and QR token are required",
      });
    }

    const prescription = await Prescription.findOne({
      prescriptionId,
      qrToken,
    })
      .populate(
        "doctor",
        "registrationId name specialization licenseNumber"
      )
      .populate(
        "patient",
        "registrationId name dateOfBirth"
      );

    if (!prescription) {
      return res.status(404).json({
        verified: false,
        message: "Invalid prescription or QR code",
      });
    }

    const block = await Block.findOne({
      index: prescription.blockchain.blockIndex,
    });

    if (!block) {
      return res.status(404).json({
        verified: false,
        message: "Blockchain record not found",
      });
    }

    const previousBlock = await Block.findOne({
      index: block.index - 1,
    });

    const valid = verifyBlock(
      block,
      previousBlock
    );

    if (!valid) {
      return res.status(400).json({
        verified: false,
        message: "Blockchain verification failed",
      });
    }

    if (
      block.hash !== prescription.blockchain.blockHash
    ) {
      return res.status(400).json({
        verified: false,
        message: "Prescription hash does not match blockchain",
      });
    }

    await AuditLog.create({
      actor: req.user.id,
      action: "PRESCRIPTION_VERIFIED",
      target: prescription.prescriptionId,
      details: {
        blockIndex: block.index,
        blockHash: block.hash,
      },
      result: "success",
    });

    res.json({
      verified: true,
      message: "Prescription verified successfully",
      prescription,
      blockchain: {
        blockIndex: block.index,
        blockHash: block.hash,
        valid: true,
      },
    });
  } catch (error) {
    res.status(500).json({
      verified: false,
      message: "Verification failed",
      error: error.message,
    });
  }
}

async function dispensePrescription(req, res) {
  try {
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findOne({
      prescriptionId,
    });

    if (!prescription) {
      return res.status(404).json({
        message: "Prescription not found",
      });
    }

    if (prescription.status === "dispensed") {
      return res.status(400).json({
        message: "Prescription has already been dispensed",
      });
    }

    if (prescription.status === "cancelled") {
      return res.status(400).json({
        message: "Prescription is cancelled",
      });
    }

    prescription.status = "dispensed";
    prescription.dispensedAt = new Date();
    prescription.dispensedBy = req.user.id;

    await prescription.save();

    await AuditLog.create({
      actor: req.user.id,
      action: "PRESCRIPTION_DISPENSED",
      target: prescription.prescriptionId,
      details: {
        dispensedAt: prescription.dispensedAt,
      },
      result: "success",
    });

    res.json({
      message: "Prescription marked as dispensed",
      prescription,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to dispense prescription",
      error: error.message,
    });
  }
}

async function getAllPrescriptions(req, res) {
  try {
    const prescriptions = await Prescription.find()
      .populate("doctor", "registrationId name specialization licenseNumber")
      .populate("patient", "registrationId name dateOfBirth")
      .populate("dispensedBy", "registrationId name")
      .sort({ createdAt: -1 });
    res.json({ prescriptions });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch prescriptions", error: error.message });
  }
}

async function getLedger(req, res) {
  try {
    const blocks = await Block.find().sort({ index: 1 });
    res.json({
      blocks: blocks.map((b) => ({
        index: b.index,
        timestamp: b.timestamp,
        hash: b.hash,
        previousHash: b.previousHash,
        prescriptionId: b.data && b.data.prescriptionId ? b.data.prescriptionId : null,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch ledger", error: error.message });
  }
}

module.exports = {
  getAllPrescriptions,
  getLedger,
  createPrescription,
  getDoctorPrescriptions,
  getPatientHistory,
  getMyPrescriptions,
  getPrescriptionById,
  verifyPrescription,
  dispensePrescription,
};