var mysql = require('mysql');
var dbConfig = null;
var connection = null;

/**
 * 获取链接
 * @param  {[type]} config [description]
 * @return {[type]}        [description]
 */
module.exports.getConnection = function(config) {
    if ((connection) && (connection._socket) && (connection._socket.readable) && (connection._socket.writable)) {
        return connection;
    }

    connection = mysql.createConnection(config || dbConfig);

    connection.connect(function(err) {
        if (err) {
            console.log("SQL CONNECT ERROR: " + err);
        } else {
            console.log("SQL CONNECT SUCCESSFUL.");

            dbConfig = config;
        }
    });

    connection.on("close", function(err) {
        console.log("SQL CONNECTION CLOSED.");
    });

    connection.on("error", function(err) {
        console.log("SQL CONNECTION ERROR: " + err);
    });

    return connection;
};
