const util = require('util')
const mysql = require("mysql");
const pool = mysql.createPool({
        connectionLimit: 100,
        host: "miliprimarydbinstance.cezjp2cnertq.us-east-2.rds.amazonaws.com",
        user: "mili_dba",
        password: "YCombinator",
        multipleStatements: true
    });

pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was closed.')
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has too many connections.')
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection was refused.')
        }
    }
    if (connection) connection.release()
    return
});

// Promisify for Node.js async/await.
pool.query = util.promisify(pool.query).bind(pool);
module.exports = pool;