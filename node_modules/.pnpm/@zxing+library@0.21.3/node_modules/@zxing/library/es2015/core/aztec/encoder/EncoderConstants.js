import SimpleToken from './SimpleToken';
export const /*final*/ MODE_NAMES = [
    'UPPER',
    'LOWER',
    'DIGIT',
    'MIXED',
    'PUNCT'
];
export const /*final*/ MODE_UPPER = 0; // 5 bits
export const /*final*/ MODE_LOWER = 1; // 5 bits
export const /*final*/ MODE_DIGIT = 2; // 4 bits
export const /*final*/ MODE_MIXED = 3; // 5 bits
export const /*final*/ MODE_PUNCT = 4; // 5 bits
export const EMPTY_TOKEN = new SimpleToken(null, 0, 0);
