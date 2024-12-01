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
/*namespace com.google.zxing.common {*/
/*import java.util.List;*/
/**
 * <p>Encapsulates the result of decoding a matrix of bits. This typically
 * applies to 2D barcode formats. For now it contains the raw bytes obtained,
 * as well as a String interpretation of those bytes, if applicable.</p>
 *
 * @author Sean Owen
 */
export default class DecoderResult {
    // public constructor(rawBytes: Uint8Array,
    //                      text: string,
    //                      List<Uint8Array> byteSegments,
    //                      String ecLevel) {
    //   this(rawBytes, text, byteSegments, ecLevel, -1, -1)
    // }
    constructor(rawBytes, text, byteSegments, ecLevel, structuredAppendSequenceNumber = -1, structuredAppendParity = -1) {
        this.rawBytes = rawBytes;
        this.text = text;
        this.byteSegments = byteSegments;
        this.ecLevel = ecLevel;
        this.structuredAppendSequenceNumber = structuredAppendSequenceNumber;
        this.structuredAppendParity = structuredAppendParity;
        this.numBits = (rawBytes === undefined || rawBytes === null) ? 0 : 8 * rawBytes.length;
    }
    /**
     * @return raw bytes representing the result, or {@code null} if not applicable
     */
    getRawBytes() {
        return this.rawBytes;
    }
    /**
     * @return how many bits of {@link #getRawBytes()} are valid; typically 8 times its length
     * @since 3.3.0
     */
    getNumBits() {
        return this.numBits;
    }
    /**
     * @param numBits overrides the number of bits that are valid in {@link #getRawBytes()}
     * @since 3.3.0
     */
    setNumBits(numBits /*int*/) {
        this.numBits = numBits;
    }
    /**
     * @return text representation of the result
     */
    getText() {
        return this.text;
    }
    /**
     * @return list of byte segments in the result, or {@code null} if not applicable
     */
    getByteSegments() {
        return this.byteSegments;
    }
    /**
     * @return name of error correction level used, or {@code null} if not applicable
     */
    getECLevel() {
        return this.ecLevel;
    }
    /**
     * @return number of errors corrected, or {@code null} if not applicable
     */
    getErrorsCorrected() {
        return this.errorsCorrected;
    }
    setErrorsCorrected(errorsCorrected /*Integer*/) {
        this.errorsCorrected = errorsCorrected;
    }
    /**
     * @return number of erasures corrected, or {@code null} if not applicable
     */
    getErasures() {
        return this.erasures;
    }
    setErasures(erasures /*Integer*/) {
        this.erasures = erasures;
    }
    /**
     * @return arbitrary additional metadata
     */
    getOther() {
        return this.other;
    }
    setOther(other) {
        this.other = other;
    }
    hasStructuredAppend() {
        return this.structuredAppendParity >= 0 && this.structuredAppendSequenceNumber >= 0;
    }
    getStructuredAppendParity() {
        return this.structuredAppendParity;
    }
    getStructuredAppendSequenceNumber() {
        return this.structuredAppendSequenceNumber;
    }
}
