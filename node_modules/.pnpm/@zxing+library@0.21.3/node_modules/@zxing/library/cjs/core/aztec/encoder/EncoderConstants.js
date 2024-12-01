"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EMPTY_TOKEN = exports.MODE_PUNCT = exports.MODE_MIXED = exports.MODE_DIGIT = exports.MODE_LOWER = exports.MODE_UPPER = exports.MODE_NAMES = void 0;
var SimpleToken_1 = require("./SimpleToken");
exports.MODE_NAMES = [
    'UPPER',
    'LOWER',
    'DIGIT',
    'MIXED',
    'PUNCT'
];
exports.MODE_UPPER = 0; // 5 bits
exports.MODE_LOWER = 1; // 5 bits
exports.MODE_DIGIT = 2; // 4 bits
exports.MODE_MIXED = 3; // 5 bits
exports.MODE_PUNCT = 4; // 5 bits
exports.EMPTY_TOKEN = new SimpleToken_1.default(null, 0, 0);
