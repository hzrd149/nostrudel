import * as C from './EncoderConstants';
import Arrays from '../../util/Arrays';
import StringUtils from '../../common/StringUtils';
export function static_CHAR_MAP(CHAR_MAP) {
    var spaceCharCode = StringUtils.getCharCode(' ');
    var pointCharCode = StringUtils.getCharCode('.');
    var commaCharCode = StringUtils.getCharCode(',');
    CHAR_MAP[C.MODE_UPPER][spaceCharCode] = 1;
    var zUpperCharCode = StringUtils.getCharCode('Z');
    var aUpperCharCode = StringUtils.getCharCode('A');
    for (var c = aUpperCharCode; c <= zUpperCharCode; c++) {
        CHAR_MAP[C.MODE_UPPER][c] = c - aUpperCharCode + 2;
    }
    CHAR_MAP[C.MODE_LOWER][spaceCharCode] = 1;
    var zLowerCharCode = StringUtils.getCharCode('z');
    var aLowerCharCode = StringUtils.getCharCode('a');
    for (var c = aLowerCharCode; c <= zLowerCharCode; c++) {
        CHAR_MAP[C.MODE_LOWER][c] = c - aLowerCharCode + 2;
    }
    CHAR_MAP[C.MODE_DIGIT][spaceCharCode] = 1;
    var nineCharCode = StringUtils.getCharCode('9');
    var zeroCharCode = StringUtils.getCharCode('0');
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
        CHAR_MAP[C.MODE_MIXED][StringUtils.getCharCode(mixedTable[i])] = i;
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
        if (StringUtils.getCharCode(punctTable[i]) > 0) {
            CHAR_MAP[C.MODE_PUNCT][StringUtils.getCharCode(punctTable[i])] = i;
        }
    }
    return CHAR_MAP;
}
export var CHAR_MAP = static_CHAR_MAP(Arrays.createInt32Array(5, 256));
