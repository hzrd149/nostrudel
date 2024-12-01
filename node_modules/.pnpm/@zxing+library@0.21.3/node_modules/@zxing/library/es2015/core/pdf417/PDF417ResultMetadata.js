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
// package com.google.zxing.pdf417;
/**
 * @author Guenther Grau
 */
export default /*public final*/ class PDF417ResultMetadata {
    constructor() {
        this.segmentCount = -1;
        this.fileSize = -1;
        this.timestamp = -1;
        this.checksum = -1;
    }
    /**
     * The Segment ID represents the segment of the whole file distributed over different symbols.
     *
     * @return File segment index
     */
    getSegmentIndex() {
        return this.segmentIndex;
    }
    setSegmentIndex(segmentIndex) {
        this.segmentIndex = segmentIndex;
    }
    /**
     * Is the same for each related PDF417 symbol
     *
     * @return File ID
     */
    getFileId() {
        return this.fileId;
    }
    setFileId(fileId) {
        this.fileId = fileId;
    }
    /**
     * @return always null
     * @deprecated use dedicated already parsed fields
     */
    //   @Deprecated
    getOptionalData() {
        return this.optionalData;
    }
    /**
     * @param optionalData old optional data format as int array
     * @deprecated parse and use new fields
     */
    //   @Deprecated
    setOptionalData(optionalData) {
        this.optionalData = optionalData;
    }
    /**
     * @return true if it is the last segment
     */
    isLastSegment() {
        return this.lastSegment;
    }
    setLastSegment(lastSegment) {
        this.lastSegment = lastSegment;
    }
    /**
     * @return count of segments, -1 if not set
     */
    getSegmentCount() {
        return this.segmentCount;
    }
    setSegmentCount(segmentCount /*int*/) {
        this.segmentCount = segmentCount;
    }
    getSender() {
        return this.sender || null;
    }
    setSender(sender) {
        this.sender = sender;
    }
    getAddressee() {
        return this.addressee || null;
    }
    setAddressee(addressee) {
        this.addressee = addressee;
    }
    /**
     * Filename of the encoded file
     *
     * @return filename
     */
    getFileName() {
        return this.fileName;
    }
    setFileName(fileName) {
        this.fileName = fileName;
    }
    /**
     * filesize in bytes of the encoded file
     *
     * @return filesize in bytes, -1 if not set
     */
    getFileSize() {
        return this.fileSize;
    }
    setFileSize(fileSize /*long*/) {
        this.fileSize = fileSize;
    }
    /**
     * 16-bit CRC checksum using CCITT-16
     *
     * @return crc checksum, -1 if not set
     */
    getChecksum() {
        return this.checksum;
    }
    setChecksum(checksum /*int*/) {
        this.checksum = checksum;
    }
    /**
     * unix epock timestamp, elapsed seconds since 1970-01-01
     *
     * @return elapsed seconds, -1 if not set
     */
    getTimestamp() {
        return this.timestamp;
    }
    setTimestamp(timestamp /*long*/) {
        this.timestamp = timestamp;
    }
}
