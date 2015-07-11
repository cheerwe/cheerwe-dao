var Util = {
    /**
     * 首尾去空格
     * @param str 需要去除空格的字符串
     */
    trim: function(str) {
        return str.replace(/(^\s*)|(\s*$)/g, "");
    },
    /**
     * 左去空格
     * @param str 需要去除空格的字符串
     */
    leftTrim: function(str) {
        return str.replace(/(^\s*)/g, "");
    },
    /**
     * 右去空格
     * @param str 需要去除空格的字符串
     */
    rightTrim: function(str) {
        return str.replace(/(\s*$)/g, "");
    },
    /**
     * 自动生成ID
     * @param prix 前缀，默认为x_
     * @param length 长度，默认为10
     */
    createId: function(prix, length) {
        prix = prix || '';
        prix += (prix.substr(0, 2) == 'x_') ? '' : 'x_';
        prix += (prix.substr(prix.length - 1, 1) == '_') ? '' : '_';

        length = length || 10;
        var _x = Math.random() * Math.pow(10, length) + '';
        return prix + _x.substr(0, _x.indexOf('.'));
    },
    /**
     * 是否是数组
     */
    isArray: function(value) {
        return Object.prototype.toString.apply(value) === '[object Array]';
    },
    /**
     * 字符串格式化
     * @param 需要格式化的字符串，例如：你好{0},我是{1}
     * @param ... 后续的参数都按照序号替换{0},{1}...
     */
    format: function(format) {
        if (!format) {
            return format;
        }
        var args = Array.prototype.slice.call(arguments, 1);
        if (Util.isArray(format)) {
            format = format.join('');
        }
        return format.replace(/\{(\d+)\}/g, function(m, i) {
            return args[i];
        });
    },
    apply: function(obj) {
        if (arguments.length < 2) {
            return obj;
        }
        for (var i = 1, len = arguments.length; i < len; i++) {
            var sour = arguments[i];

            for (var s in sour) {
                obj[s] = sour[s];
            }
        }
        return obj;
    },
    applyIf: function(obj) {
        if (arguments.length < 2) {
            return obj;
        }

        for (var i = 1, len = arguments.length; i < len; i++) {
            var sour = arguments[i];

            for (var s in sour) {
                if (obj[s] === undefined) {
                    obj[s] = sour[s];
                }
            }
        }

        return obj;
    },
    override: function(clazz, ext) {
        if (arguments.length < 2) {
            return clazz;
        }

        var prototype = clazz.prototype;
        for (var i = 1, len = arguments.length; i < len; i++) {
            Util.apply(prototype, arguments[i]);
        }
        return clazz;
    },
    formatDate: function(date, format) {
        if (!date) {
            return '';
        }
        if (typeof(date) == 'string') {
            date = new Date(date);
        } else if (typeof(date) == 'object') {
            if (!(date instanceof Date)) {
                return '';
            }
        }
        format = format || 'yyyy-MM-dd HH:mm:ss';
        var o = {
            "M+": date.getMonth() + 1, //month
            "d+": date.getDate(), //day
            "h+": date.getHours(), //hour
            "H+": date.getHours(), //hour
            "m+": date.getMinutes(), //minute
            "s+": date.getSeconds(), //second
            "q+": Math.floor((date.getMonth() + 3) / 3), //quarter
            "S": date.getMilliseconds() //millisecond
        };

        if (/(y+)/.test(format)) {
            format = format.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
        }

        for (var k in o) {
            if (new RegExp("(" + k + ")").test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
            }
        }
        return format;
    },
    formatNum: function(num, format) {
        num += '';
        format = format || '0000';
        return format.substr(0, format.length - num.length) + num;
    },
    MD5: function(data) {
        var _encrymd5 = require('crypto').createHash('md5');
        _encrymd5.update(data);
        return _encrymd5.digest('hex');
    }
};

module.exports = Util;
