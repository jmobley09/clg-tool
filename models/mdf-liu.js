// Dependencies
const mongoose = require('mongoose');

// Creates Model
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

let MdfSchema = new mongoose.Schema({
  Location: {
    type: String,
    required: true,
  },
  Row: {
    type: String,
    required: true,
  },
  Rack: {
    type: String,
    required: true,
  },
  RU: {
    type: String,
    required: true,
  },
  "Remote Location": {
    type: String,
    required: true,
  },
  "Remote Row": {
    type: String,
    required: true,
  },
  "Remote Rack": {
    type: String,
    required: true,
  },
  "Remote RU": {
    type: String,
    required: true,
  }
});
const collectionName = 'mdf';
module.exports = mongoose.model('mdf', MdfSchema, collectionName);