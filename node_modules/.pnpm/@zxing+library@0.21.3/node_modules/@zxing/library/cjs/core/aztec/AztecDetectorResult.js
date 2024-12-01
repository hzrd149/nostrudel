"use strict";
/*
 * Copyright 2010 ZXing authors
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
var DetectorResult_1 = require("../common/DetectorResult");
/**
 * <p>Extends {@link DetectorResult} with more information specific to the Aztec format,
 * like the number of layers and whether it's compact.</p>
 *
 * @author Sean Owen
 */
var AztecDetectorResult = /** @class */ (function (_super) {
    __extends(AztecDetectorResult, _super);
    function AztecDetectorResult(bits, points, compact, nbDatablocks, nbLayers) {
        var _this = _super.call(this, bits, points) || this;
        _this.compact = compact;
        _this.nbDatablocks = nbDatablocks;
        _this.nbLayers = nbLayers;
        return _this;
    }
    AztecDetectorResult.prototype.getNbLayers = function () {
        return this.nbLayers;
    };
    AztecDetectorResult.prototype.getNbDatablocks = function () {
        return this.nbDatablocks;
    };
    AztecDetectorResult.prototype.isCompact = function () {
        return this.compact;
    };
    return AztecDetectorResult;
}(DetectorResult_1.default));
exports.default = AztecDetectorResult;
