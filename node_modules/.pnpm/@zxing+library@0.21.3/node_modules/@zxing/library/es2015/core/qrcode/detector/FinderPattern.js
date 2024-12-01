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
 * <p>Encapsulates a finder pattern, which are the three square patterns found in
 * the corners of QR Codes. It also encapsulates a count of similar finder patterns,
 * as a convenience to the finder's bookkeeping.</p>
 *
 * @author Sean Owen
 */
export default class FinderPattern extends ResultPoint {
    // FinderPattern(posX: number/*float*/, posY: number/*float*/, estimatedModuleSize: number/*float*/) {
    //   this(posX, posY, estimatedModuleSize, 1)
    // }
    constructor(posX /*float*/, posY /*float*/, estimatedModuleSize /*float*/, count /*int*/) {
        super(posX, posY);
        this.estimatedModuleSize = estimatedModuleSize;
        this.count = count;
        if (undefined === count) {
            this.count = 1;
        }
    }
    getEstimatedModuleSize() {
        return this.estimatedModuleSize;
    }
    getCount() {
        return this.count;
    }
    /*
    void incrementCount() {
      this.count++
    }
     */
    /**
     * <p>Determines if this finder pattern "about equals" a finder pattern at the stated
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
     * with a new estimate. It returns a new {@code FinderPattern} containing a weighted average
     * based on count.
     */
    combineEstimate(i /*float*/, j /*float*/, newModuleSize /*float*/) {
        const combinedCount = this.count + 1;
        const combinedX = (this.count * this.getX() + j) / combinedCount;
        const combinedY = (this.count * this.getY() + i) / combinedCount;
        const combinedModuleSize = (this.count * this.estimatedModuleSize + newModuleSize) / combinedCount;
        return new FinderPattern(combinedX, combinedY, combinedModuleSize, combinedCount);
    }
}
