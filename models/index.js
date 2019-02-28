'use strict';

const mongoose = require('mongoose');
const url = 'mongodb://localhost:27017/liudb';

mongoose.connect(url);

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const Liu = new Schema ({
  location: "",
  connection: "",
})




// const assert = require('assert');
// const MongoClient = require('mongodb').MongoClient;

// // db url

// const findDocuments = function (db, callback) {
//   // Get the documents collection
//   const collection = db.collection('documents');
//   // Find some documents
//   collection.find({}).toArray(function (err, docs) {
//     assert.equal(err, null);
//     console.log("Found the following records");
//     callback(docs);
//   });
// };

// // Use connect method to connect to the Server
// MongoClient.connect(url, function (err, db) {

//   assert.equal(null, err);
//   console.log("Connected correctly to server");
//   findDocuments(db, function (docs) {
//     exports.getall = function () {
//       return docs;
//     }
//     db.close();
//   });
// });
