var DAO = require('./src/dao');
var DBHelper = require('./src/db-helper');

/**
 * 数据库初始化方法
 * @param  {[type]} dbconfig [description]
 * @return {[type]}          [description]
 */
DAO.init = function(dbconfig) {
    DBHelper.getConnection(dbconfig);
};


module.exports = DAO;
