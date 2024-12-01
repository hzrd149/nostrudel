"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.PROD_SYMBOLS = void 0;
/**
 * Symbol info table for DataMatrix.
 */
var SymbolInfo = /** @class */ (function () {
    function SymbolInfo(rectangular, dataCapacity, errorCodewords, matrixWidth, matrixHeight, dataRegions, rsBlockData, rsBlockError) {
        if (rsBlockData === void 0) { rsBlockData = 0; }
        if (rsBlockError === void 0) { rsBlockError = 0; }
        this.rectangular = rectangular;
        this.dataCapacity = dataCapacity;
        this.errorCodewords = errorCodewords;
        this.matrixWidth = matrixWidth;
        this.matrixHeight = matrixHeight;
        this.dataRegions = dataRegions;
        this.rsBlockData = rsBlockData;
        this.rsBlockError = rsBlockError;
    }
    SymbolInfo.lookup = function (dataCodewords, shape, minSize, maxSize, fail) {
        var e_1, _a;
        if (shape === void 0) { shape = 0 /* FORCE_NONE */; }
        if (minSize === void 0) { minSize = null; }
        if (maxSize === void 0) { maxSize = null; }
        if (fail === void 0) { fail = true; }
        try {
            for (var PROD_SYMBOLS_1 = __values(exports.PROD_SYMBOLS), PROD_SYMBOLS_1_1 = PROD_SYMBOLS_1.next(); !PROD_SYMBOLS_1_1.done; PROD_SYMBOLS_1_1 = PROD_SYMBOLS_1.next()) {
                var symbol = PROD_SYMBOLS_1_1.value;
                if (shape === 1 /* FORCE_SQUARE */ && symbol.rectangular) {
                    continue;
                }
                if (shape === 2 /* FORCE_RECTANGLE */ && !symbol.rectangular) {
                    continue;
                }
                if (minSize != null &&
                    (symbol.getSymbolWidth() < minSize.getWidth() ||
                        symbol.getSymbolHeight() < minSize.getHeight())) {
                    continue;
                }
                if (maxSize != null &&
                    (symbol.getSymbolWidth() > maxSize.getWidth() ||
                        symbol.getSymbolHeight() > maxSize.getHeight())) {
                    continue;
                }
                if (dataCodewords <= symbol.dataCapacity) {
                    return symbol;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (PROD_SYMBOLS_1_1 && !PROD_SYMBOLS_1_1.done && (_a = PROD_SYMBOLS_1.return)) _a.call(PROD_SYMBOLS_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        if (fail) {
            throw new Error("Can't find a symbol arrangement that matches the message. Data codewords: " +
                dataCodewords);
        }
        return null;
    };
    SymbolInfo.prototype.getHorizontalDataRegions = function () {
        switch (this.dataRegions) {
            case 1:
                return 1;
            case 2:
            case 4:
                return 2;
            case 16:
                return 4;
            case 36:
                return 6;
            default:
                throw new Error('Cannot handle this number of data regions');
        }
    };
    SymbolInfo.prototype.getVerticalDataRegions = function () {
        switch (this.dataRegions) {
            case 1:
            case 2:
                return 1;
            case 4:
                return 2;
            case 16:
                return 4;
            case 36:
                return 6;
            default:
                throw new Error('Cannot handle this number of data regions');
        }
    };
    SymbolInfo.prototype.getSymbolDataWidth = function () {
        return this.getHorizontalDataRegions() * this.matrixWidth;
    };
    SymbolInfo.prototype.getSymbolDataHeight = function () {
        return this.getVerticalDataRegions() * this.matrixHeight;
    };
    SymbolInfo.prototype.getSymbolWidth = function () {
        return this.getSymbolDataWidth() + this.getHorizontalDataRegions() * 2;
    };
    SymbolInfo.prototype.getSymbolHeight = function () {
        return this.getSymbolDataHeight() + this.getVerticalDataRegions() * 2;
    };
    SymbolInfo.prototype.getCodewordCount = function () {
        return this.dataCapacity + this.errorCodewords;
    };
    SymbolInfo.prototype.getInterleavedBlockCount = function () {
        if (!this.rsBlockData)
            return 1;
        return this.dataCapacity / this.rsBlockData;
    };
    SymbolInfo.prototype.getDataCapacity = function () {
        return this.dataCapacity;
    };
    SymbolInfo.prototype.getErrorCodewords = function () {
        return this.errorCodewords;
    };
    SymbolInfo.prototype.getDataLengthForInterleavedBlock = function (index) {
        return this.rsBlockData;
    };
    SymbolInfo.prototype.getErrorLengthForInterleavedBlock = function (index) {
        return this.rsBlockError;
    };
    return SymbolInfo;
}());
exports.default = SymbolInfo;
var DataMatrixSymbolInfo144 = /** @class */ (function (_super) {
    __extends(DataMatrixSymbolInfo144, _super);
    function DataMatrixSymbolInfo144() {
        return _super.call(this, false, 1558, 620, 22, 22, 36, -1, 62) || this;
    }
    DataMatrixSymbolInfo144.prototype.getInterleavedBlockCount = function () {
        return 10;
    };
    DataMatrixSymbolInfo144.prototype.getDataLengthForInterleavedBlock = function (index) {
        return index <= 8 ? 156 : 155;
    };
    return DataMatrixSymbolInfo144;
}(SymbolInfo));
exports.PROD_SYMBOLS = [
    new SymbolInfo(false, 3, 5, 8, 8, 1),
    new SymbolInfo(false, 5, 7, 10, 10, 1),
    /*rect*/ new SymbolInfo(true, 5, 7, 16, 6, 1),
    new SymbolInfo(false, 8, 10, 12, 12, 1),
    /*rect*/ new SymbolInfo(true, 10, 11, 14, 6, 2),
    new SymbolInfo(false, 12, 12, 14, 14, 1),
    /*rect*/ new SymbolInfo(true, 16, 14, 24, 10, 1),
    new SymbolInfo(false, 18, 14, 16, 16, 1),
    new SymbolInfo(false, 22, 18, 18, 18, 1),
    /*rect*/ new SymbolInfo(true, 22, 18, 16, 10, 2),
    new SymbolInfo(false, 30, 20, 20, 20, 1),
    /*rect*/ new SymbolInfo(true, 32, 24, 16, 14, 2),
    new SymbolInfo(false, 36, 24, 22, 22, 1),
    new SymbolInfo(false, 44, 28, 24, 24, 1),
    /*rect*/ new SymbolInfo(true, 49, 28, 22, 14, 2),
    new SymbolInfo(false, 62, 36, 14, 14, 4),
    new SymbolInfo(false, 86, 42, 16, 16, 4),
    new SymbolInfo(false, 114, 48, 18, 18, 4),
    new SymbolInfo(false, 144, 56, 20, 20, 4),
    new SymbolInfo(false, 174, 68, 22, 22, 4),
    new SymbolInfo(false, 204, 84, 24, 24, 4, 102, 42),
    new SymbolInfo(false, 280, 112, 14, 14, 16, 140, 56),
    new SymbolInfo(false, 368, 144, 16, 16, 16, 92, 36),
    new SymbolInfo(false, 456, 192, 18, 18, 16, 114, 48),
    new SymbolInfo(false, 576, 224, 20, 20, 16, 144, 56),
    new SymbolInfo(false, 696, 272, 22, 22, 16, 174, 68),
    new SymbolInfo(false, 816, 336, 24, 24, 16, 136, 56),
    new SymbolInfo(false, 1050, 408, 18, 18, 36, 175, 68),
    new SymbolInfo(false, 1304, 496, 20, 20, 36, 163, 62),
    new DataMatrixSymbolInfo144(),
];
