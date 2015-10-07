var mysql = require('mysql');
var connection = null;

/**
 * 获取数据库连接
 * @param  {[type]} config [description]
 * @return {[type]}        [description]
 */
module.exports.getConnection = function() {
    if ((connection) && (connection._socket) && (connection._socket.readable) && (connection._socket.writable)) {
        return connection;
    }

    connection = mysql.createConnection(this.dbConfig);

    connection.connect(function(err) {
        if (err) {
            console.log("SQL CONNECT ERROR: " + err);
        } else {
            console.log("SQL CONNECT SUCCESSFUL.");
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

/**
 * 初始化数据库连接
 * @param  {[type]} config [description]
 * @return {[type]}        [description]
 */
module.exports.initConnection = function(config) {
    this.dbConfig = config;

    this.getConnection();
};

module.exports.endConnection = function() {
    return;
};