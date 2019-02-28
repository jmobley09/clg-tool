// *********************************************************************************
// CONNECTION.JS - THIS FILE INITIATES THE CONNECTION TO DATABASE
// *********************************************************************************

// Dependencies
const mongoose = require('mongoose');

// Creates MongoDB connection using mongoose.
mongoose.connect('mongodb://localhost:27017/liudb');

// Creates Model
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const Liu = new Schema({
  id: ObjectId,
  location: String,
  remote: String
});

// Exports the connection for other files to use
// module.exports = Liu;

// Required modules
// const mongoose = require('mongoose');
// const model = require('../config/connection.js');


const db = mongoose.model('liu', Liu);

const newLiu = new db({
  location: 'US.MSC.02.01.1100.25.015',
  remote: '1100.01'
});

// db.find({}, function (err, docs) {
//   if (err) return err;
//   console.log(docs);
// })

console.log(newLiu.location);