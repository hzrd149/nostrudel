/*
 * Copyright (C) 2010 ZXing authors
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
import AbstractUPCEANReader from './AbstractUPCEANReader';
import UPCEANExtension5Support from './UPCEANExtension5Support';
import UPCEANExtension2Support from './UPCEANExtension2Support';
var UPCEANExtensionSupport = /** @class */ (function () {
    function UPCEANExtensionSupport() {
    }
    UPCEANExtensionSupport.decodeRow = function (rowNumber, row, rowOffset) {
        var extensionStartRange = AbstractUPCEANReader.findGuardPattern(row, rowOffset, false, this.EXTENSION_START_PATTERN, new Int32Array(this.EXTENSION_START_PATTERN.length).fill(0));
        try {
            // return null;
            var fiveSupport = new UPCEANExtension5Support();
            return fiveSupport.decodeRow(rowNumber, row, extensionStartRange);
        }
        catch (err) {
            // return null;
            var twoSupport = new UPCEANExtension2Support();
            return twoSupport.decodeRow(rowNumber, row, extensionStartRange);
        }
    };
    UPCEANExtensionSupport.EXTENSION_START_PATTERN = Int32Array.from([1, 1, 2]);
    return UPCEANExtensionSupport;
}());
export default UPCEANExtensionSupport;
