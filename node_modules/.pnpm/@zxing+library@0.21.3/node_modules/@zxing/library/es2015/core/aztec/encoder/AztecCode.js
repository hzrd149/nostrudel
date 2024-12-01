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
/**
 * Aztec 2D code representation
 *
 * @author Rustam Abdullaev
 */
export default /*public final*/ class AztecCode {
    /**
     * @return {@code true} if compact instead of full mode
     */
    isCompact() {
        return this.compact;
    }
    setCompact(compact) {
        this.compact = compact;
    }
    /**
     * @return size in pixels (width and height)
     */
    getSize() {
        return this.size;
    }
    setSize(size) {
        this.size = size;
    }
    /**
     * @return number of levels
     */
    getLayers() {
        return this.layers;
    }
    setLayers(layers) {
        this.layers = layers;
    }
    /**
     * @return number of data codewords
     */
    getCodeWords() {
        return this.codeWords;
    }
    setCodeWords(codeWords) {
        this.codeWords = codeWords;
    }
    /**
     * @return the symbol image
     */
    getMatrix() {
        return this.matrix;
    }
    setMatrix(matrix) {
        this.matrix = matrix;
    }
}
