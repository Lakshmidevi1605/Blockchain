require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const { seedData } = require("./scripts/seed");

const authRoutes = require("./routes/authRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "RxChain API is running",
  });
});

app.use("/api/auth", authRoutes);

app.use(
  "/api/prescriptions",
  prescriptionRoutes
);

app.use("/api/admin", adminRoutes);

app.use("/api/users", userRoutes);

// ---- Serve the frontend from the same origin (no CORS / file:// problems) ----
// Only public folders are exposed, never rxchain-backend/.env
const FRONT = path.join(__dirname, "..");
for (const dir of ["css", "js", "assets", "pages"]) {
  app.use("/" + dir, express.static(path.join(FRONT, dir)));
}
app.get(["/", "/index.html"], (req, res) => res.sendFile(path.join(FRONT, "index.html")));
app.get("/login.html", (req, res) => res.sendFile(path.join(FRONT, "login.html")));

app.use("/api", (req, res) => {
  res.status(404).json({
    message: "API route not found",
    path: req.originalUrl,
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  await seedData();

  app.listen(PORT, () => {
    console.log(
      `[server] RxChain running -> open http://localhost:${PORT}`
    );
  });
}

startServer().catch((error) => {
  console.error("[server] Startup failed:", error);
  process.exit(1);
});