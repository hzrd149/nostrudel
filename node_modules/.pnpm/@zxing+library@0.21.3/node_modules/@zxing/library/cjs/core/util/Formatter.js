"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Java Formatter class polyfill that works in the JS way.
 */
var Formatter = /** @class */ (function () {
    function Formatter() {
        this.buffer = '';
    }
    /**
     *
     * @see https://stackoverflow.com/a/13439711/4367683
     *
     * @param str
     * @param arr
     */
    Formatter.form = function (str, arr) {
        var i = -1;
        function callback(exp, p0, p1, p2, p3, p4) {
            if (exp === '%%')
                return '%';
            if (arr[++i] === undefined)
                return undefined;
            exp = p2 ? parseInt(p2.substr(1)) : undefined;
            var base = p3 ? parseInt(p3.substr(1)) : undefined;
            var val;
            switch (p4) {
                case 's':
                    val = arr[i];
                    break;
                case 'c':
                    val = arr[i][0];
                    break;
                case 'f':
                    val = parseFloat(arr[i]).toFixed(exp);
                    break;
                case 'p':
                    val = parseFloat(arr[i]).toPrecision(exp);
                    break;
                case 'e':
                    val = parseFloat(arr[i]).toExponential(exp);
                    break;
                case 'x':
                    val = parseInt(arr[i]).toString(base ? base : 16);
                    break;
                case 'd':
                    val = parseFloat(parseInt(arr[i], base ? base : 10).toPrecision(exp)).toFixed(0);
                    break;
            }
            val = typeof val === 'object' ? JSON.stringify(val) : (+val).toString(base);
            var size = parseInt(p1); /* padding size */
            var ch = p1 && (p1[0] + '') === '0' ? '0' : ' '; /* isnull? */
            while (val.length < size)
                val = p0 !== undefined ? val + ch : ch + val; /* isminus? */
            return val;
        }
        var regex = /%(-)?(0?[0-9]+)?([.][0-9]+)?([#][0-9]+)?([scfpexd%])/g;
        return str.replace(regex, callback);
    };
    /**
     *
     * @param append The new string to append.
     * @param args Argumets values to be formated.
     */
    Formatter.prototype.format = function (append) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.buffer += Formatter.form(append, args);
    };
    /**
     * Returns the Formatter string value.
     */
    Formatter.prototype.toString = function () {
        return this.buffer;
    };
    return Formatter;
}());
exports.default = Formatter;
