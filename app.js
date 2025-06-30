const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const requestRoutes = require("./routes/requestRoutes");
const connectDB = require("./config/db");

const app = express();

//Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Database connection
connectDB();

// Routes
app.use("/api/user", userRoutes);
app.use("/api/request", requestRoutes);

//Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

module.exports = app;
