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
/*namespace com.google.zxing.qrcode.detector {*/
import ResultPoint from '../../ResultPoint';
/**
 * <p>Encapsulates an alignment pattern, which are the smaller square patterns found in
 * all but the simplest QR Codes.</p>
 *
 * @author Sean Owen
 */
export default class AlignmentPattern extends ResultPoint {
    constructor(posX /*float*/, posY /*float*/, estimatedModuleSize /*float*/) {
        super(posX, posY);
        this.estimatedModuleSize = estimatedModuleSize;
    }
    /**
     * <p>Determines if this alignment pattern "about equals" an alignment pattern at the stated
     * position and size -- meaning, it is at nearly the same center with nearly the same size.</p>
     */
    aboutEquals(moduleSize /*float*/, i /*float*/, j /*float*/) {
        if (Math.abs(i - this.getY()) <= moduleSize && Math.abs(j - this.getX()) <= moduleSize) {
            const moduleSizeDiff = Math.abs(moduleSize - this.estimatedModuleSize);
            return moduleSizeDiff <= 1.0 || moduleSizeDiff <= this.estimatedModuleSize;
        }
        return false;
    }
    /**
     * Combines this object's current estimate of a finder pattern position and module size
     * with a new estimate. It returns a new {@code FinderPattern} containing an average of the two.
     */
    combineEstimate(i /*float*/, j /*float*/, newModuleSize /*float*/) {
        const combinedX = (this.getX() + j) / 2.0;
        const combinedY = (this.getY() + i) / 2.0;
        const combinedModuleSize = (this.estimatedModuleSize + newModuleSize) / 2.0;
        return new AlignmentPattern(combinedX, combinedY, combinedModuleSize);
    }
}
