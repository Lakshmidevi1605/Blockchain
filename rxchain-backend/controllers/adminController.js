const User = require("../models/User");
const Prescription = require("../models/Prescription");
const Block = require("../models/Block");
const AuditLog = require("../models/AuditLog");

async function getUsers(req, res) {
  try {
    const users = await User.find()
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    res.json({ users });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch users",
      error: error.message,
    });
  }
}

async function getStats(req, res) {
  try {
    const [
      totalUsers,
      doctors,
      patients,
      pharmacies,
      prescriptions,
      activePrescriptions,
      dispensedPrescriptions,
      blocks,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "doctor" }),
      User.countDocuments({ role: "patient" }),
      User.countDocuments({ role: "pharmacy" }),
      Prescription.countDocuments(),
      Prescription.countDocuments({ status: "active" }),
      Prescription.countDocuments({ status: "dispensed" }),
      Block.countDocuments(),
    ]);

    res.json({
      stats: {
        totalUsers,
        doctors,
        patients,
        pharmacies,
        prescriptions,
        activePrescriptions,
        dispensedPrescriptions,
        blockchainBlocks: blocks,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch statistics",
      error: error.message,
    });
  }
}

async function getBlocks(req, res) {
  try {
    const blocks = await Block.find()
      .sort({ index: 1 });

    res.json({ blocks });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch blockchain",
      error: error.message,
    });
  }
}

async function getAuditLogs(req, res) {
  try {
    const logs = await AuditLog.find()
      .populate(
        "actor",
        "registrationId name role"
      )
      .sort({ createdAt: -1 })
      .limit(200);

    res.json({ logs });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch audit logs",
      error: error.message,
    });
  }
}

module.exports = {
  getUsers,
  getStats,
  getBlocks,
  getAuditLogs,
};