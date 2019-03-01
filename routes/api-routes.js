// *********************************************************************************
// api-routes.js - this file offers a set of routes for displaying and saving data to the db
// *********************************************************************************

// Dependencies
// =============================================================
const mongoose = require('mongoose');

// Requiring our models
const liudb = require("../models/liu.js");

// Routes
// =============================================================
module.exports = function (app) {

    // GET route for getting all database data 
    app.get("/api/liu/", function (req, res) {
        liudb.find({}).then(doc => {
            res.json(doc);
        })
    });

    // GET route for getting specific location data
    app.get("/api/liu/:location", function (req, res) {
        liudb.find({
            Remote: req.params.location
        }).then(doc => {
            res.jsonp(doc);
            return JSON.stringify(doc);
        })
    });
};