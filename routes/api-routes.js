// *********************************************************************************
// api-routes.js - this file offers a set of routes for displaying and saving data to the db
// *********************************************************************************

// Dependencies
// =============================================================
const mongoose = require('mongoose');

// Requiring our models
const liudb = require("../models/liu.js");

// 
// uncomment to create new data in db
// 

// let test = new liudb({
//     location: "US.MSC.02.01.1100.25.15.45",
//     remote: '1100.01.02'
// });
// test.save()
//     .then(doc => {
//         console.log(doc);
//     })
//     .catch(err => {
//         console.error(err);
//     })


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
            location: req.params.location
        }).then(doc => {
            res.json(doc);
        })
    });
};