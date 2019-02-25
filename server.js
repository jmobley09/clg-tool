// Dependencies
// =============================================================
const express = require("express");
const path = require("path");
const mysql = require("mysql");

// Sets up the Express App
// =============================================================
const app = express();
const PORT = process.env.PORT || 4000;

// Sets up the Express app to handle data parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
// =============================================================

// Basic route that sends the user first to the AJAX Page
app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "/html/index.html"));
});

// sends users to the features page
app.get("/features", function(req, res) {
  res.sendFile(path.join(__dirname, "/html/features.html"));
});

// send users to the schedule page
app.get("/schedule", function(req, res) {
  res.sendFile(path.join(__dirname, "/html/schedule.html"));
});

// sends users to the bugs page
app.get("/bugs", function(req, res) {
  res.sendFile(path.join(__dirname, "/html/bugs.html"));
});

// Displays all characters
app.get("/api/characters", function(req, res) {
  return res.json(characters);
});

// Loads the assets folder to the server for the use of js and css files
app.use('/assets', express.static('assets'));

// Starts the server to begin listening
// =============================================================
app.listen(PORT, function() {
  console.log("App listening on PORT " + PORT);
});

const connection = mysql.createConnection({
  host: "localhost",

  // Your port; if not 3306
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: "Futurpilot09",
  database: "liu_db"
});


