const express = require("express");
const session = require("express-session");
const cors = require("cors");
require("dotenv").config();
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const inventoryRoutes = require("./routes/inventory");
const transferRoutes = require("./routes/transfer");
const checkoutRoutes = require("./routes/checkout");
const dashboardRoutes = require("./routes/dashboard");
const logsRoutes = require("./routes/logs");
const db = require("./models");
const app = express();
const path = require("path");
const httpServer = require("http").createServer(app);
const SequelizeStore = require("connect-session-sequelize")(session.Store);
const sessionStore = new SequelizeStore({
  db: db.sequelize,
});

// Konfigurasi express-session
app.use(
  session({
    secret: "your-secret-key", // Ganti dengan string acak yang kuat
    resave: false,
    saveUninitialized: false,
    store: sessionStore, // <-- use this
    cookie: {
      secure: false, // Set true if using HTTPS
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
    }
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "https://inventory-drinks.bountygroup.co.id",
    credentials: true,
  })
);

// Serve static files from "pdfs" folder
app.use("/pdfs", express.static(path.join(__dirname, "pdfs")));

// Serve static files from "uploads" folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/transfer", transferRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/logs", logsRoutes);

// Test route
app.get("/", (req, res) => res.send("Inventory Drinks API running"));

db.sequelize.sync({ alter: false }).then(() => {
  console.log("Database connected and tables synced!");
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
