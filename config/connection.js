// // *********************************************************************************
// // CONNECTION.JS - THIS FILE INITIATES THE CONNECTION TO DATABASE
// // *********************************************************************************

// // Dependencies
// const mongoose = require('mongoose');

// // Creates MongoDB connection using mongoose.
// mongoose.connect('mongodb://dbadmin:Futurpilot09@ssclg-shard-00-00-wkabs.mongodb.net:27017,ssclg-shard-00-01-wkabs.mongodb.net:27017,ssclg-shard-00-02-wkabs.mongodb.net:27017/test?ssl=true&replicaSet=ssclg-shard-0&authSource=admin&retryWrites=true');

// // Creates Model
// const Schema = mongoose.Schema;
// const ObjectId = Schema.ObjectId;

// const Liu = new Schema({
//   id: ObjectId,
//   location: String,
//   remote: String
// });

// const db = mongoose.model('liu', Liu);

// const newLiu = new db({
//   location: 'US.MSC.02.01.1100.25.015',
//   remote: '1100.01'
// });