const mysql = require("mysql");

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

let queryResults = {};

function connect() {
  connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    // console.log(afterconnection(1500,25));
    afterconnection(1100, 1500, 25);
  });
};
function afterconnection(hall, dhall, row) {

  connection.query('SELECT * FROM `locations` WHERE `hall` = ? and`destination_hall` = ? and `destination_row` = ?', [hall, dhall, row], function (error, results, fields) {
    queryResults = results[0];
    returnResults();
  });
  connection.end();
};
connect();
function returnResults() {
  console.log(queryResults);
  return queryResults;
}

module.exports = {
  results: returnResults()
}