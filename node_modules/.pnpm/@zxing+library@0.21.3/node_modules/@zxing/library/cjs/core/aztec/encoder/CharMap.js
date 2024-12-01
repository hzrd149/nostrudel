"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHAR_MAP = exports.static_CHAR_MAP = void 0;
var C = require("./EncoderConstants");
var Arrays_1 = require("../../util/Arrays");
var StringUtils_1 = require("../../common/StringUtils");
function static_CHAR_MAP(CHAR_MAP) {
    var spaceCharCode = StringUtils_1.default.getCharCode(' ');
    var pointCharCode = StringUtils_1.default.getCharCode('.');
    var commaCharCode = StringUtils_1.default.getCharCode(',');
    CHAR_MAP[C.MODE_UPPER][spaceCharCode] = 1;
    var zUpperCharCode = StringUtils_1.default.getCharCode('Z');
    var aUpperCharCode = StringUtils_1.default.getCharCode('A');
    for (var c = aUpperCharCode; c <= zUpperCharCode; c++) {
        CHAR_MAP[C.MODE_UPPER][c] = c - aUpperCharCode + 2;
    }
    CHAR_MAP[C.MODE_LOWER][spaceCharCode] = 1;
    var zLowerCharCode = StringUtils_1.default.getCharCode('z');
    var aLowerCharCode = StringUtils_1.default.getCharCode('a');
    for (var c = aLowerCharCode; c <= zLowerCharCode; c++) {
        CHAR_MAP[C.MODE_LOWER][c] = c - aLowerCharCode + 2;
    }
    CHAR_MAP[C.MODE_DIGIT][spaceCharCode] = 1;
    var nineCharCode = StringUtils_1.default.getCharCode('9');
    var zeroCharCode = StringUtils_1.default.getCharCode('0');
    for (var c = zeroCharCode; c <= nineCharCode; c++) {
        CHAR_MAP[C.MODE_DIGIT][c] = c - zeroCharCode + 2;
    }
    CHAR_MAP[C.MODE_DIGIT][commaCharCode] = 12;
    CHAR_MAP[C.MODE_DIGIT][pointCharCode] = 13;
    var mixedTable = [
        '\x00',
        ' ',
        '\x01',
        '\x02',
        '\x03',
        '\x04',
        '\x05',
        '\x06',
        '\x07',
        '\b',
        '\t',
        '\n',
        '\x0b',
        '\f',
        '\r',
        '\x1b',
        '\x1c',
        '\x1d',
        '\x1e',
        '\x1f',
        '@',
        '\\',
        '^',
        '_',
        '`',
        '|',
        '~',
        '\x7f'
    ];
    for (var i = 0; i < mixedTable.length; i++) {
        CHAR_MAP[C.MODE_MIXED][StringUtils_1.default.getCharCode(mixedTable[i])] = i;
    }
    var punctTable = [
        '\x00',
        '\r',
        '\x00',
        '\x00',
        '\x00',
        '\x00',
        '!',
        '\'',
        '#',
        '$',
        '%',
        '&',
        '\'',
        '(',
        ')',
        '*',
        '+',
        ',',
        '-',
        '.',
        '/',
        ':',
        ';',
        '<',
        '=',
        '>',
        '?',
        '[',
        ']',
        '{',
        '}'
    ];
    for (var i = 0; i < punctTable.length; i++) {
        if (StringUtils_1.default.getCharCode(punctTable[i]) > 0) {
            CHAR_MAP[C.MODE_PUNCT][StringUtils_1.default.getCharCode(punctTable[i])] = i;
        }
    }
    return CHAR_MAP;
}
exports.static_CHAR_MAP = static_CHAR_MAP;
exports.CHAR_MAP = static_CHAR_MAP(Arrays_1.default.createInt32Array(5, 256));
