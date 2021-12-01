var mysql = require('mysql');
var db = mysql.createConnection({
    host: 'host',
    user: 'user',
    password: 'password',
    database: 'database'
});

module.exports = db;