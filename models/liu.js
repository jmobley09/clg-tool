// *********************************************************************************
// THIS FILE INITIATES THE CONNECTION TO DATABASE
// *********************************************************************************

// Dependencies
const mongoose = require('mongoose');
const validator = require('validator');

// Creates MongoDB connection using mongoose.
mongoose.connect('mongodb://dbadmin:Futurpilot09@ssclg-shard-00-00-wkabs.mongodb.net:27017,ssclg-shard-00-01-wkabs.mongodb.net:27017,ssclg-shard-00-02-wkabs.mongodb.net:27017/test?ssl=true&replicaSet=ssclg-shard-0&authSource=admin&retryWrites=true');

console.log(mongoose.connection.readyState);

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
});
const collectionName = 'liu';
module.exports = mongoose.model('liu', LiuSchema, collectionName);