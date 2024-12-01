import SimpleToken from './SimpleToken';
export var /*final*/ MODE_NAMES = [
    'UPPER',
    'LOWER',
    'DIGIT',
    'MIXED',
    'PUNCT'
];
export var /*final*/ MODE_UPPER = 0; // 5 bits
export var /*final*/ MODE_LOWER = 1; // 5 bits
export var /*final*/ MODE_DIGIT = 2; // 4 bits
export var /*final*/ MODE_MIXED = 3; // 5 bits
export var /*final*/ MODE_PUNCT = 4; // 5 bits
export var EMPTY_TOKEN = new SimpleToken(null, 0, 0);
