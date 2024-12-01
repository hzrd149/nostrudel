"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHIFT_TABLE = exports.static_SHIFT_TABLE = void 0;
var Arrays_1 = require("../../util/Arrays");
var C = require("./EncoderConstants");
function static_SHIFT_TABLE(SHIFT_TABLE) {
    var e_1, _a;
    try {
        for (var SHIFT_TABLE_1 = __values(SHIFT_TABLE), SHIFT_TABLE_1_1 = SHIFT_TABLE_1.next(); !SHIFT_TABLE_1_1.done; SHIFT_TABLE_1_1 = SHIFT_TABLE_1.next()) {
            var table = SHIFT_TABLE_1_1.value /*Int32Array*/;
            Arrays_1.default.fill(table, -1);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (SHIFT_TABLE_1_1 && !SHIFT_TABLE_1_1.done && (_a = SHIFT_TABLE_1.return)) _a.call(SHIFT_TABLE_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    SHIFT_TABLE[C.MODE_UPPER][C.MODE_PUNCT] = 0;
    SHIFT_TABLE[C.MODE_LOWER][C.MODE_PUNCT] = 0;
    SHIFT_TABLE[C.MODE_LOWER][C.MODE_UPPER] = 28;
    SHIFT_TABLE[C.MODE_MIXED][C.MODE_PUNCT] = 0;
    SHIFT_TABLE[C.MODE_DIGIT][C.MODE_PUNCT] = 0;
    SHIFT_TABLE[C.MODE_DIGIT][C.MODE_UPPER] = 15;
    return SHIFT_TABLE;
}
exports.static_SHIFT_TABLE = static_SHIFT_TABLE;
exports.SHIFT_TABLE = static_SHIFT_TABLE(Arrays_1.default.createInt32Array(6, 6)); // mode shift codes, per table
