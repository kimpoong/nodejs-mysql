var mysql = require('mysql');
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '626933',
    database: 'nodejs'
});

connection.connect();

connection.query('SELECT * from author', function (error, results, fields) {
    if (error) throw error;
    console.log(results);
});

connection.end();