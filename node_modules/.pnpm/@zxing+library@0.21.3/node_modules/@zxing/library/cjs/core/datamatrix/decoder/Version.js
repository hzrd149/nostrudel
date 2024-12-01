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
exports.ECB = exports.ECBlocks = void 0;
var FormatException_1 = require("../../FormatException");
/*
 * Copyright 2007 ZXing authors
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
/**
 * <p>Encapsulates a set of error-correction blocks in one symbol version. Most versions will
 * use blocks of differing sizes within one version, so, this encapsulates the parameters for
 * each set of blocks. It also holds the number of error-correction codewords per block since it
 * will be the same across all blocks within one version.</p>
 */
var ECBlocks = /** @class */ (function () {
    function ECBlocks(ecCodewords, ecBlocks1, ecBlocks2) {
        this.ecCodewords = ecCodewords;
        this.ecBlocks = [ecBlocks1];
        ecBlocks2 && this.ecBlocks.push(ecBlocks2);
    }
    ECBlocks.prototype.getECCodewords = function () {
        return this.ecCodewords;
    };
    ECBlocks.prototype.getECBlocks = function () {
        return this.ecBlocks;
    };
    return ECBlocks;
}());
exports.ECBlocks = ECBlocks;
/**
 * <p>Encapsulates the parameters for one error-correction block in one symbol version.
 * This includes the number of data codewords, and the number of times a block with these
 * parameters is used consecutively in the Data Matrix code version's format.</p>
 */
var ECB = /** @class */ (function () {
    function ECB(count, dataCodewords) {
        this.count = count;
        this.dataCodewords = dataCodewords;
    }
    ECB.prototype.getCount = function () {
        return this.count;
    };
    ECB.prototype.getDataCodewords = function () {
        return this.dataCodewords;
    };
    return ECB;
}());
exports.ECB = ECB;
/**
 * The Version object encapsulates attributes about a particular
 * size Data Matrix Code.
 *
 * @author bbrown@google.com (Brian Brown)
 */
var Version = /** @class */ (function () {
    function Version(versionNumber, symbolSizeRows, symbolSizeColumns, dataRegionSizeRows, dataRegionSizeColumns, ecBlocks) {
        var e_1, _a;
        this.versionNumber = versionNumber;
        this.symbolSizeRows = symbolSizeRows;
        this.symbolSizeColumns = symbolSizeColumns;
        this.dataRegionSizeRows = dataRegionSizeRows;
        this.dataRegionSizeColumns = dataRegionSizeColumns;
        this.ecBlocks = ecBlocks;
        // Calculate the total number of codewords
        var total = 0;
        var ecCodewords = ecBlocks.getECCodewords();
        var ecbArray = ecBlocks.getECBlocks();
        try {
            for (var ecbArray_1 = __values(ecbArray), ecbArray_1_1 = ecbArray_1.next(); !ecbArray_1_1.done; ecbArray_1_1 = ecbArray_1.next()) {
                var ecBlock = ecbArray_1_1.value;
                total += ecBlock.getCount() * (ecBlock.getDataCodewords() + ecCodewords);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (ecbArray_1_1 && !ecbArray_1_1.done && (_a = ecbArray_1.return)) _a.call(ecbArray_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        this.totalCodewords = total;
    }
    Version.prototype.getVersionNumber = function () {
        return this.versionNumber;
    };
    Version.prototype.getSymbolSizeRows = function () {
        return this.symbolSizeRows;
    };
    Version.prototype.getSymbolSizeColumns = function () {
        return this.symbolSizeColumns;
    };
    Version.prototype.getDataRegionSizeRows = function () {
        return this.dataRegionSizeRows;
    };
    Version.prototype.getDataRegionSizeColumns = function () {
        return this.dataRegionSizeColumns;
    };
    Version.prototype.getTotalCodewords = function () {
        return this.totalCodewords;
    };
    Version.prototype.getECBlocks = function () {
        return this.ecBlocks;
    };
    /**
     * <p>Deduces version information from Data Matrix dimensions.</p>
     *
     * @param numRows Number of rows in modules
     * @param numColumns Number of columns in modules
     * @return Version for a Data Matrix Code of those dimensions
     * @throws FormatException if dimensions do correspond to a valid Data Matrix size
     */
    Version.getVersionForDimensions = function (numRows, numColumns) {
        var e_2, _a;
        if ((numRows & 0x01) !== 0 || (numColumns & 0x01) !== 0) {
            throw new FormatException_1.default();
        }
        try {
            for (var _b = __values(Version.VERSIONS), _c = _b.next(); !_c.done; _c = _b.next()) {
                var version = _c.value;
                if (version.symbolSizeRows === numRows && version.symbolSizeColumns === numColumns) {
                    return version;
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
        throw new FormatException_1.default();
    };
    //  @Override
    Version.prototype.toString = function () {
        return '' + this.versionNumber;
    };
    /**
     * See ISO 16022:2006 5.5.1 Table 7
     */
    Version.buildVersions = function () {
        return [
            new Version(1, 10, 10, 8, 8, new ECBlocks(5, new ECB(1, 3))),
            new Version(2, 12, 12, 10, 10, new ECBlocks(7, new ECB(1, 5))),
            new Version(3, 14, 14, 12, 12, new ECBlocks(10, new ECB(1, 8))),
            new Version(4, 16, 16, 14, 14, new ECBlocks(12, new ECB(1, 12))),
            new Version(5, 18, 18, 16, 16, new ECBlocks(14, new ECB(1, 18))),
            new Version(6, 20, 20, 18, 18, new ECBlocks(18, new ECB(1, 22))),
            new Version(7, 22, 22, 20, 20, new ECBlocks(20, new ECB(1, 30))),
            new Version(8, 24, 24, 22, 22, new ECBlocks(24, new ECB(1, 36))),
            new Version(9, 26, 26, 24, 24, new ECBlocks(28, new ECB(1, 44))),
            new Version(10, 32, 32, 14, 14, new ECBlocks(36, new ECB(1, 62))),
            new Version(11, 36, 36, 16, 16, new ECBlocks(42, new ECB(1, 86))),
            new Version(12, 40, 40, 18, 18, new ECBlocks(48, new ECB(1, 114))),
            new Version(13, 44, 44, 20, 20, new ECBlocks(56, new ECB(1, 144))),
            new Version(14, 48, 48, 22, 22, new ECBlocks(68, new ECB(1, 174))),
            new Version(15, 52, 52, 24, 24, new ECBlocks(42, new ECB(2, 102))),
            new Version(16, 64, 64, 14, 14, new ECBlocks(56, new ECB(2, 140))),
            new Version(17, 72, 72, 16, 16, new ECBlocks(36, new ECB(4, 92))),
            new Version(18, 80, 80, 18, 18, new ECBlocks(48, new ECB(4, 114))),
            new Version(19, 88, 88, 20, 20, new ECBlocks(56, new ECB(4, 144))),
            new Version(20, 96, 96, 22, 22, new ECBlocks(68, new ECB(4, 174))),
            new Version(21, 104, 104, 24, 24, new ECBlocks(56, new ECB(6, 136))),
            new Version(22, 120, 120, 18, 18, new ECBlocks(68, new ECB(6, 175))),
            new Version(23, 132, 132, 20, 20, new ECBlocks(62, new ECB(8, 163))),
            new Version(24, 144, 144, 22, 22, new ECBlocks(62, new ECB(8, 156), new ECB(2, 155))),
            new Version(25, 8, 18, 6, 16, new ECBlocks(7, new ECB(1, 5))),
            new Version(26, 8, 32, 6, 14, new ECBlocks(11, new ECB(1, 10))),
            new Version(27, 12, 26, 10, 24, new ECBlocks(14, new ECB(1, 16))),
            new Version(28, 12, 36, 10, 16, new ECBlocks(18, new ECB(1, 22))),
            new Version(29, 16, 36, 14, 16, new ECBlocks(24, new ECB(1, 32))),
            new Version(30, 16, 48, 14, 22, new ECBlocks(28, new ECB(1, 49)))
        ];
    };
    Version.VERSIONS = Version.buildVersions();
    return Version;
}());
exports.default = Version;
