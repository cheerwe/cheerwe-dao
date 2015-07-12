var DAO = require('./src/dao');
var DBHelper = require('./src/db-helper');

/**
 * 数据库初始化方法
 * @param  {[type]} dbconfig [description]
 * @return {[type]}          [description]
 */
DAO.init = function(dbconfig, isDev) {
    DBHelper.getConnection(dbconfig);
    DAO.isDev = isDev;
};


module.exports = DAO;
