"use strict";
/*
 * Copyright 2013 ZXing authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
// package com.google.zxing.pdf417.decoder;
// import com.google.zxing.pdf417.PDF417Common;
var PDF417Common_1 = require("../PDF417Common");
// import java.util.ArrayList;
// import java.util.Collection;
// import java.util.HashMap;
// import java.util.Map;
// import java.util.Map.Entry;
/**
 * @author Guenther Grau
 */
var BarcodeValue = /** @class */ (function () {
    function BarcodeValue() {
        this.values = new Map();
    }
    /**
     * Add an occurrence of a value
     */
    BarcodeValue.prototype.setValue = function (value) {
        value = Math.trunc(value);
        var confidence = this.values.get(value);
        if (confidence == null) {
            confidence = 0;
        }
        confidence++;
        this.values.set(value, confidence);
    };
    /**
     * Determines the maximum occurrence of a set value and returns all values which were set with this occurrence.
     * @return an array of int, containing the values with the highest occurrence, or null, if no value was set
     */
    BarcodeValue.prototype.getValue = function () {
        var e_1, _a;
        var maxConfidence = -1;
        var result = new Array();
        var _loop_1 = function (key, value) {
            var entry = {
                getKey: function () { return key; },
                getValue: function () { return value; },
            };
            if (entry.getValue() > maxConfidence) {
                maxConfidence = entry.getValue();
                result = [];
                result.push(entry.getKey());
            }
            else if (entry.getValue() === maxConfidence) {
                result.push(entry.getKey());
            }
        };
        try {
            for (var _b = __values(this.values.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                _loop_1(key, value);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return PDF417Common_1.default.toIntArray(result);
    };
    BarcodeValue.prototype.getConfidence = function (value) {
        return this.values.get(value);
    };
    return BarcodeValue;
}());
exports.default = BarcodeValue;
