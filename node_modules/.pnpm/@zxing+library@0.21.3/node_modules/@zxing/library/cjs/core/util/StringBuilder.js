"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var StringUtils_1 = require("../common/StringUtils");
var StringBuilder = /** @class */ (function () {
    function StringBuilder(value) {
        if (value === void 0) { value = ''; }
        this.value = value;
    }
    StringBuilder.prototype.enableDecoding = function (encoding) {
        this.encoding = encoding;
        return this;
    };
    StringBuilder.prototype.append = function (s) {
        if (typeof s === 'string') {
            this.value += s.toString();
        }
        else if (this.encoding) {
            // use passed format (fromCharCode will return UTF8 encoding)
            this.value += StringUtils_1.default.castAsNonUtf8Char(s, this.encoding);
        }
        else {
            // correctly converts from UTF-8, but not other encodings
            this.value += String.fromCharCode(s);
        }
        return this;
    };
    StringBuilder.prototype.appendChars = function (str, offset, len) {
        for (var i = offset; offset < offset + len; i++) {
            this.append(str[i]);
        }
        return this;
    };
    StringBuilder.prototype.length = function () {
        return this.value.length;
    };
    StringBuilder.prototype.charAt = function (n) {
        return this.value.charAt(n);
    };
    StringBuilder.prototype.deleteCharAt = function (n) {
        this.value = this.value.substr(0, n) + this.value.substring(n + 1);
    };
    StringBuilder.prototype.setCharAt = function (n, c) {
        this.value = this.value.substr(0, n) + c + this.value.substr(n + 1);
    };
    StringBuilder.prototype.substring = function (start, end) {
        return this.value.substring(start, end);
    };
    /**
     * @note helper method for RSS Expanded
     */
    StringBuilder.prototype.setLengthToZero = function () {
        this.value = '';
    };
    StringBuilder.prototype.toString = function () {
        return this.value;
    };
    StringBuilder.prototype.insert = function (n, c) {
        this.value = this.value.substring(0, n) + c + this.value.substring(n);
    };
    return StringBuilder;
}());
exports.default = StringBuilder;
