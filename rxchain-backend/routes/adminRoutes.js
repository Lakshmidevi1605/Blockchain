const express = require("express");

const router = express.Router();

const {
  authenticate,
  requireRole,
} = require("../middleware/auth");

const {
  getUsers,
  getStats,
  getBlocks,
  getAuditLogs,
} = require("../controllers/adminController");

router.get(
  "/users",
  authenticate,
  requireRole("admin"),
  getUsers
);

router.get(
  "/stats",
  authenticate,
  requireRole("admin"),
  getStats
);

router.get(
  "/blocks",
  authenticate,
  requireRole("admin"),
  getBlocks
);

router.get(
  "/audit-logs",
  authenticate,
  requireRole("admin"),
  getAuditLogs
);

module.exports = router;