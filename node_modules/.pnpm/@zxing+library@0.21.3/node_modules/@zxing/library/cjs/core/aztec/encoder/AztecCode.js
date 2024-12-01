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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Aztec 2D code representation
 *
 * @author Rustam Abdullaev
 */
var AztecCode = /** @class */ (function () {
    function AztecCode() {
    }
    /**
     * @return {@code true} if compact instead of full mode
     */
    AztecCode.prototype.isCompact = function () {
        return this.compact;
    };
    AztecCode.prototype.setCompact = function (compact) {
        this.compact = compact;
    };
    /**
     * @return size in pixels (width and height)
     */
    AztecCode.prototype.getSize = function () {
        return this.size;
    };
    AztecCode.prototype.setSize = function (size) {
        this.size = size;
    };
    /**
     * @return number of levels
     */
    AztecCode.prototype.getLayers = function () {
        return this.layers;
    };
    AztecCode.prototype.setLayers = function (layers) {
        this.layers = layers;
    };
    /**
     * @return number of data codewords
     */
    AztecCode.prototype.getCodeWords = function () {
        return this.codeWords;
    };
    AztecCode.prototype.setCodeWords = function (codeWords) {
        this.codeWords = codeWords;
    };
    /**
     * @return the symbol image
     */
    AztecCode.prototype.getMatrix = function () {
        return this.matrix;
    };
    AztecCode.prototype.setMatrix = function (matrix) {
        this.matrix = matrix;
    };
    return AztecCode;
}());
exports.default = AztecCode;
