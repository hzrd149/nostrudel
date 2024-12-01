"use strict";
/*
 * Copyright 2008 ZXing authors
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
Object.defineProperty(exports, "__esModule", { value: true });
/*namespace com.google.zxing.oned {*/
var BarcodeFormat_1 = require("../BarcodeFormat");
var NotFoundException_1 = require("../NotFoundException");
var OneDReader_1 = require("./OneDReader");
var Result_1 = require("../Result");
var ResultPoint_1 = require("../ResultPoint");
/**
 * <p>Decodes CodaBar barcodes. </p>
 *
 * @author Evan @dodobelieve
 * @see CodaBarReader
 */
var CodaBarReader = /** @class */ (function (_super) {
    __extends(CodaBarReader, _super);
    function CodaBarReader() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.CODA_BAR_CHAR_SET = {
            nnnnnww: '0',
            nnnnwwn: '1',
            nnnwnnw: '2',
            wwnnnnn: '3',
            nnwnnwn: '4',
            wnnnnwn: '5',
            nwnnnnw: '6',
            nwnnwnn: '7',
            nwwnnnn: '8',
            wnnwnnn: '9',
            nnnwwnn: '-',
            nnwwnnn: '$',
            wnnnwnw: ':',
            wnwnnnw: '/',
            wnwnwnn: '.',
            nnwwwww: '+',
            nnwwnwn: 'A',
            nwnwnnw: 'B',
            nnnwnww: 'C',
            nnnwwwn: 'D'
        };
        return _this;
    }
    CodaBarReader.prototype.decodeRow = function (rowNumber, row, hints) {
        var validRowData = this.getValidRowData(row);
        if (!validRowData)
            throw new NotFoundException_1.default();
        var retStr = this.codaBarDecodeRow(validRowData.row);
        if (!retStr)
            throw new NotFoundException_1.default();
        return new Result_1.default(retStr, null, 0, [new ResultPoint_1.default(validRowData.left, rowNumber), new ResultPoint_1.default(validRowData.right, rowNumber)], BarcodeFormat_1.default.CODABAR, new Date().getTime());
    };
    /**
     * converts bit array to valid data array(lengths of black bits and white bits)
     * @param row bit array to convert
     */
    CodaBarReader.prototype.getValidRowData = function (row) {
        var booleanArr = row.toArray();
        var startIndex = booleanArr.indexOf(true);
        if (startIndex === -1)
            return null;
        var lastIndex = booleanArr.lastIndexOf(true);
        if (lastIndex <= startIndex)
            return null;
        booleanArr = booleanArr.slice(startIndex, lastIndex + 1);
        var result = [];
        var lastBit = booleanArr[0];
        var bitLength = 1;
        for (var i = 1; i < booleanArr.length; i++) {
            if (booleanArr[i] === lastBit) {
                bitLength++;
            }
            else {
                lastBit = booleanArr[i];
                result.push(bitLength);
                bitLength = 1;
            }
        }
        result.push(bitLength);
        // CodaBar code data valid
        if (result.length < 23 && (result.length + 1) % 8 !== 0)
            return null;
        return { row: result, left: startIndex, right: lastIndex };
    };
    /**
     * decode codabar code
     * @param row row to cecode
     */
    CodaBarReader.prototype.codaBarDecodeRow = function (row) {
        var code = [];
        var barThreshold = Math.ceil(row.reduce(function (pre, item) { return (pre + item) / 2; }, 0));
        // Read one encoded character at a time.
        while (row.length > 0) {
            var seg = row.splice(0, 8).splice(0, 7);
            var key = seg.map(function (len) { return (len < barThreshold ? 'n' : 'w'); }).join('');
            if (this.CODA_BAR_CHAR_SET[key] === undefined)
                return null;
            code.push(this.CODA_BAR_CHAR_SET[key]);
        }
        var strCode = code.join('');
        if (this.validCodaBarString(strCode))
            return strCode;
        return null;
    };
    /**
     * check if the string is a CodaBar string
     * @param src string to determine
     */
    CodaBarReader.prototype.validCodaBarString = function (src) {
        var reg = /^[A-D].{1,}[A-D]$/;
        return reg.test(src);
    };
    return CodaBarReader;
}(OneDReader_1.default));
exports.default = CodaBarReader;
