const mysql = require("mysql");

var QueryResults;
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
const sqlResults = function () {
  connection.connect(function (err) {
    if (err) throw err;
    console.log("connected as id " + connection.threadId);
    connection.query('SELECT * FROM `Locations`', function (error, results, fields) {
      // error will be an Error if one occurred during the query
      // results will contain the results of the query
      // fields will contain information about the returned results fields (if any)
      console.log(results);
      QueryResults = results;
    });

    connection.end();
  });
}
sqlResults();
module.exports = {
  results: sqlResults
}