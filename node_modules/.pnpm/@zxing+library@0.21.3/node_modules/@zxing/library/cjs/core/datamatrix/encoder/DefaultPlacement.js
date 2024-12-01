"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Arrays_1 = require("../../util/Arrays");
/**
 * Symbol Character Placement Program. Adapted from Annex M.1 in ISO/IEC 16022:2000(E).
 */
var DefaultPlacement = /** @class */ (function () {
    /**
     * Main constructor
     *
     * @param codewords the codewords to place
     * @param numcols   the number of columns
     * @param numrows   the number of rows
     */
    function DefaultPlacement(codewords, numcols, numrows) {
        this.codewords = codewords;
        this.numcols = numcols;
        this.numrows = numrows;
        this.bits = new Uint8Array(numcols * numrows);
        Arrays_1.default.fill(this.bits, 2); // Initialize with "not set" value
    }
    DefaultPlacement.prototype.getNumrows = function () {
        return this.numrows;
    };
    DefaultPlacement.prototype.getNumcols = function () {
        return this.numcols;
    };
    DefaultPlacement.prototype.getBits = function () {
        return this.bits;
    };
    DefaultPlacement.prototype.getBit = function (col, row) {
        return this.bits[row * this.numcols + col] === 1;
    };
    DefaultPlacement.prototype.setBit = function (col, row, bit) {
        this.bits[row * this.numcols + col] = bit ? 1 : 0;
    };
    DefaultPlacement.prototype.noBit = function (col, row) {
        return this.bits[row * this.numcols + col] === 2;
    };
    DefaultPlacement.prototype.place = function () {
        var pos = 0;
        var row = 4;
        var col = 0;
        do {
            // repeatedly first check for one of the special corner cases, then...
            if (row === this.numrows && col === 0) {
                this.corner1(pos++);
            }
            if (row === this.numrows - 2 && col === 0 && this.numcols % 4 !== 0) {
                this.corner2(pos++);
            }
            if (row === this.numrows - 2 && col === 0 && this.numcols % 8 === 4) {
                this.corner3(pos++);
            }
            if (row === this.numrows + 4 && col === 2 && this.numcols % 8 === 0) {
                this.corner4(pos++);
            }
            // sweep upward diagonally, inserting successive characters...
            do {
                if (row < this.numrows && col >= 0 && this.noBit(col, row)) {
                    this.utah(row, col, pos++);
                }
                row -= 2;
                col += 2;
            } while (row >= 0 && col < this.numcols);
            row++;
            col += 3;
            // and then sweep downward diagonally, inserting successive characters, ...
            do {
                if (row >= 0 && col < this.numcols && this.noBit(col, row)) {
                    this.utah(row, col, pos++);
                }
                row += 2;
                col -= 2;
            } while (row < this.numrows && col >= 0);
            row += 3;
            col++;
            // ...until the entire array is scanned
        } while (row < this.numrows || col < this.numcols);
        // Lastly, if the lower right-hand corner is untouched, fill in fixed pattern
        if (this.noBit(this.numcols - 1, this.numrows - 1)) {
            this.setBit(this.numcols - 1, this.numrows - 1, true);
            this.setBit(this.numcols - 2, this.numrows - 2, true);
        }
    };
    DefaultPlacement.prototype.module = function (row, col, pos, bit) {
        if (row < 0) {
            row += this.numrows;
            col += 4 - ((this.numrows + 4) % 8);
        }
        if (col < 0) {
            col += this.numcols;
            row += 4 - ((this.numcols + 4) % 8);
        }
        // Note the conversion:
        var v = this.codewords.charCodeAt(pos);
        v &= 1 << (8 - bit);
        this.setBit(col, row, v !== 0);
    };
    /**
     * Places the 8 bits of a utah-shaped symbol character in ECC200.
     *
     * @param row the row
     * @param col the column
     * @param pos character position
     */
    DefaultPlacement.prototype.utah = function (row, col, pos) {
        this.module(row - 2, col - 2, pos, 1);
        this.module(row - 2, col - 1, pos, 2);
        this.module(row - 1, col - 2, pos, 3);
        this.module(row - 1, col - 1, pos, 4);
        this.module(row - 1, col, pos, 5);
        this.module(row, col - 2, pos, 6);
        this.module(row, col - 1, pos, 7);
        this.module(row, col, pos, 8);
    };
    DefaultPlacement.prototype.corner1 = function (pos) {
        this.module(this.numrows - 1, 0, pos, 1);
        this.module(this.numrows - 1, 1, pos, 2);
        this.module(this.numrows - 1, 2, pos, 3);
        this.module(0, this.numcols - 2, pos, 4);
        this.module(0, this.numcols - 1, pos, 5);
        this.module(1, this.numcols - 1, pos, 6);
        this.module(2, this.numcols - 1, pos, 7);
        this.module(3, this.numcols - 1, pos, 8);
    };
    DefaultPlacement.prototype.corner2 = function (pos) {
        this.module(this.numrows - 3, 0, pos, 1);
        this.module(this.numrows - 2, 0, pos, 2);
        this.module(this.numrows - 1, 0, pos, 3);
        this.module(0, this.numcols - 4, pos, 4);
        this.module(0, this.numcols - 3, pos, 5);
        this.module(0, this.numcols - 2, pos, 6);
        this.module(0, this.numcols - 1, pos, 7);
        this.module(1, this.numcols - 1, pos, 8);
    };
    DefaultPlacement.prototype.corner3 = function (pos) {
        this.module(this.numrows - 3, 0, pos, 1);
        this.module(this.numrows - 2, 0, pos, 2);
        this.module(this.numrows - 1, 0, pos, 3);
        this.module(0, this.numcols - 2, pos, 4);
        this.module(0, this.numcols - 1, pos, 5);
        this.module(1, this.numcols - 1, pos, 6);
        this.module(2, this.numcols - 1, pos, 7);
        this.module(3, this.numcols - 1, pos, 8);
    };
    DefaultPlacement.prototype.corner4 = function (pos) {
        this.module(this.numrows - 1, 0, pos, 1);
        this.module(this.numrows - 1, this.numcols - 1, pos, 2);
        this.module(0, this.numcols - 3, pos, 3);
        this.module(0, this.numcols - 2, pos, 4);
        this.module(0, this.numcols - 1, pos, 5);
        this.module(1, this.numcols - 3, pos, 6);
        this.module(1, this.numcols - 2, pos, 7);
        this.module(1, this.numcols - 1, pos, 8);
    };
    return DefaultPlacement;
}());
exports.default = DefaultPlacement;
