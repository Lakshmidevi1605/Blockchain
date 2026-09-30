require("dotenv").config();

const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Block = require("../models/Block");
const { createGenesisBlock } = require("../utils/blockchain");

const users = [
  { registrationId: "DOC-1024", name: "Dr. Kavitha Raman", role: "doctor", password: "doctor123", specialization: "General Medicine", licenseNumber: "TN-MED-4471" },
  { registrationId: "PAT-2048", name: "A. Meiyarasi", role: "patient", password: "patient123", dateOfBirth: "1998-03-14" },
  { registrationId: "PHR-3072", name: "City Care Pharmacy", role: "pharmacy", password: "pharmacy123", licenseNumber: "PY-PH-1187" },
  { registrationId: "ADM-4096", name: "System Admin", role: "admin", password: "admin123" },
];

// Idempotent: safe to call on every server start.
async function seedData() {
  for (const item of users) {
    if (await User.findOne({ registrationId: item.registrationId })) continue;
    const { password, ...rest } = item;
    await User.create({ ...rest, passwordHash: await bcrypt.hash(password, 10) });
    console.log(`[seed] created ${item.role}: ${item.registrationId}`);
  }
  if (!(await Block.findOne({ index: 0 }))) {
    await Block.create(createGenesisBlock());
    console.log("[seed] genesis block created");
  }
}

module.exports = { seedData };

if (require.main === module) {
  const connectDB = require("../config/db");
  connectDB()
    .then(seedData)
    .then(() => { console.log("[seed] complete"); process.exit(0); })
    .catch((e) => { console.error("[seed] failed:", e); process.exit(1); });
}
