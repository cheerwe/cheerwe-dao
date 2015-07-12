var Util = require('cheerwe-util'),
    dbHelper = require('./db-helper'),
    mysql = require('mysql'),
    nodeUtil = require('util'),
    nodeUUID = require('node-uuid'),
    SQL = {
        SELECT: 'select * from {0}',
        SELECT_IN: 'select * from {0} where ?? in (?)',
        INSERT: 'insert into ?? set ?',
        DELETE: 'delete from ? where ??=?',
        DELETE_IN: 'delete from ?? where ?? in (?)',
        UPDATE: 'update ?? set ? where ??=?',
        GETMODE: 'select * from ?? where ??=?',
        COUNT: 'select count(?) as total from ??'
    };


var DAO = function(config) {
    Util.apply(this, config);
};

DAO.log = function() {
    if (DAO.isDev) {
        console.log.apply(console, arguments);
    }
}

var daoPrototype = {
    dbHelper: dbHelper,
    pkField: 'id',
    viewName: '',
    tableName: '',
    newUUID: function() {
        return nodeUUID.v1();
    },
    doTransaction: function(sqlList, callback) {
        var conn = dbHelper.getConnection();
        conn.beginTransaction(function(err) {
            if (err) {
                throw err;
            }
            var index = 0,
                len = sqlList.length,
                runSql = function() {
                    var item = sqlList[index],
                        sql = '',
                        data = [];
                    if (typeof(item) == 'object') {
                        data = item.data;
                        sql = item.sql;
                    } else {
                        sql = item;
                    }
                    conn.query(sql, data, function(err, ret) {
                        index++;
                        if (err) {
                            conn.rollback(function() {
                                throw err;
                            });
                        }
                        if (index == len) {
                            conn.commit(function(err) {
                                if (err) {
                                    conn.rollback(function() {
                                        throw err;
                                    });
                                } else {
                                    callback();
                                }
                            });
                        } else {
                            runSql();
                        }
                    });
                };

            runSql();
        });
    },
    query: function(sql, callback) {
        var conn = dbHelper.getConnection();
        var query = conn.query(sql, [], function(err, ret) {
            callback && callback(err, ret);
        });

        DAO.log(query.sql);
        return query;
        // dbHelper.endConnection(conn, query);
    },
    getConditionStr: function(condition) {
        if (!condition) {
            return '';
        }
        if (typeof condition == 'string') {
            return condition;
        }
        condition = [].concat(condition);

        var str = [];
        condition.forEach(function(item, index) {
            var tpl = '';
            switch (item.op) {
                case 'in':
                    tpl = "{0} {1} ('{2}') {3}";
                    break;
                default:
                    tpl = "{0} {1} '{2}' {3}";
                    break;
            }
            str.push(Util.format(tpl, item.key, item.op, item.value, item.condition || 'and'));
        });
        str.push('1=1');

        return 'where ' + str.join(' ');
    },
    getOrderByStr: function(orderby) {
        if (!orderby) {
            return '';
        }
        var str = [];
        for (var field in orderby) {
            var dir = orderby[field];

            str.push([field, dir].join(' '));
        }
        if (str.length) {
            str = 'order by ' + str.join(',');
        }
        return str;
    },
    getList: function(condition, orderby, callback) {
        if (typeof condition == 'function') {
            callback = condition;
            condition = null;
            order = null;
        } else if (typeof(orderby) == 'function') {
            callback = orderby;
            orderby = null;
        }

        var sql = [Util.format(SQL.SELECT, this.viewName || this.tableName)];

        sql.push(this.getConditionStr(condition));
        sql.push(this.getOrderByStr(orderby));

        var conn = dbHelper.getConnection(),
            query = conn.query(sql.join(' '), callback);

        DAO.log(query.sql);
        return query;

        // dbHelper.endConnection(conn, query);
        // console.log(query.sql);
    },
    /**
    *@param config
    {
        condition:[],
        orderby:[],
        pagesize:20,
        pageindex:1
    }
    */
    getPageList: function(config, callback) {
        config = config || {};
        if (typeof(config) == 'function') {
            callback = config;
            config = {};
        }
        var tableName = this.viewName || this.tableName,
            conditionStr = this.getConditionStr(config.condition),
            orderbyStr = this.getOrderByStr(config.orderby),
            countSql = mysql.format(SQL.COUNT, [this.pkField, tableName]),
            selectSql = Util.format(SQL.SELECT, tableName),
            pageStr = '';

        if (config.pageSize) {
            config.pageIndex = config.pageIndex || 0;
            var start = config.pageSize * config.pageIndex,
                end = config.pageSize;

            pageStr = ['LIMIT', ' ', start, ',', end].join('');
        }

        var sqlList = [];
        selectSql = [selectSql, conditionStr, orderbyStr, pageStr].join(' ');
        countSql = [countSql, conditionStr, orderbyStr].join(' ');
        selectSql = Util.trim(selectSql);
        countSql = Util.trim(countSql);

        sqlList.push(selectSql);
        sqlList.push(countSql);

        var conn = dbHelper.getConnection(),
            query = conn.query(sqlList.join('; '), function(err, rets) {
                if (err || rets.length != 2) {
                    callback(err, null);
                } else {
                    callback(err, rets[0], rets[1][0].total);
                }
            });

        DAO.log(query.sql);
        return query;


        // dbHelper.endConnection(conn, query);
        // console.log(sqlList);
    },
    save: function(mode, callback) {
        if (mode[this.pkField]) {
            return this.edit(mode, callback);
        } else {
            return this.add(mode, callback);
        }
    },
    add: function(mode, callback) {
        mode[this.pkField] = mode[this.pkField] || nodeUUID.v1();

        var conn = dbHelper.getConnection(),
            query = conn.query(SQL.INSERT, [this.tableName, mode], function(err, ret) {
                if (callback) {
                    if (err) {
                        callback(err, false);
                        console.log(err);
                    } else {
                        callback(err, true);
                    }
                }
            });
        DAO.log(query.sql);
        return query;

        // dbHelper.endConnection(conn, query);
        //      console.log(query.sql);
    },
    edit: function(mode, callback) {
        var conn = dbHelper.getConnection(),

            query = conn.query(SQL.UPDATE, [this.tableName, mode, this.pkField, mode[this.pkField]], function(err, ret) {
                if (callback) {
                    if (err) {
                        callback(err, false);
                        console.log(err);
                    } else {
                        callback(err, true);
                    }
                }
            });

        DAO.log(query.sql);
        return query;

        // dbHelper.endConnection(conn, query);

        //      console.log(query.sql);
    },
    getMode: function(id, callback) {
        var tableName = this.viewName || this.tableName,
            conn = dbHelper.getConnection(),
            query = conn.query(SQL.GETMODE, [tableName, this.pkField, id], function(err, ret) {
                if (callback) {
                    var mode = undefined;
                    if (!err && ret.length) {
                        mode = ret[0];
                    }
                    callback(err, mode);
                }
            });

        DAO.log(query.sql);
        return query;

        // dbHelper.endConnection(conn, query);
        // console.log(query.sql);
    },
    del: function(ids, callback) {
        var sql = mysql.format(SQL.DELETE_IN, [this.tableName, this.pkField, ids.split(',')]),
            conn = dbHelper.getConnection(),
            query = conn.query(sql, function(err, ret) {
                if (callback) {
                    if (err) {
                        callback(err, false);
                        console.log(err);
                    } else {
                        callback(err, true);
                    }
                }
            });
        DAO.log(query.sql);
        return query;

        // console.log(sql);
        // dbHelper.endConnection(conn, query);
    },
    getListIn: function(ids, callback) {
        var sql = Util.format(SQL.SELECT_IN, this.tableName);
        if (!nodeUtil.isArray(ids)) {
            ids = ids.split(',');
        }
        var conn = dbHelper.getConnection(),
            query = conn.query(sql, [this.pkField, ids], function(err, ret) {
                if (callback) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(err, ret);
                    }
                }
            });

        DAO.log(query.sql);
        return query;

        // dbHelper.endConnection(conn, query);
    }
}



Util.override(DAO, daoPrototype);
var extend = function(superclass, exconfig) {
    var fn = function(config) {
        Util.apply(this, config);
    };
    var sp = superclass.prototype;
    fn.prototype = Util.apply({}, sp, exconfig);
    fn.superclass = sp;

    var _ins = null;
    fn.getInstance = function() {
        if (!_ins) {
            _ins = new fn();
        }
        return _ins;
    };
    fn.extend = function(exconfig) {
        return extend(fn, exconfig);
    };
    return fn;
};

DAO.extend = function(exconfig) {
    return extend(DAO, exconfig);
};

module.exports = DAO;
