// *********************************************************************************
// THIS FILE INITIATES THE CONNECTION TO DATABASE
// *********************************************************************************

// Dependencies
const mongoose = require('mongoose');
const validator = require('validator');

// Creates MongoDB connection using mongoose.
mongoose.connect('mongodb://localhost:27017/liudb');

// Creates Model
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

let LiuSchema = new mongoose.Schema({
  Location: {
    type: String,
    required: true,
  },
  RU: {
    type: String,
    required: true,
  },
  Remote: {
    type: String,
    required: true
  },
  RemoteTwo: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('liu', LiuSchema);