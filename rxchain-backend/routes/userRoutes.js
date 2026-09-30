const express = require("express");

const router = express.Router();

const {
  authenticate,
  requireRole,
} = require("../middleware/auth");

const {
  createUser,
  getPatients,
  getProfile,
} = require("../controllers/userController");

router.get(
  "/profile",
  authenticate,
  getProfile
);

router.get(
  "/patients",
  authenticate,
  requireRole("doctor", "admin"),
  getPatients
);

router.post(
  "/",
  authenticate,
  requireRole("doctor", "admin"),
  createUser
);

module.exports = router;