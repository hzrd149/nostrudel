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
var PDF417ResultMetadata = /** @class */ (function () {
    function PDF417ResultMetadata() {
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
    PDF417ResultMetadata.prototype.getSegmentIndex = function () {
        return this.segmentIndex;
    };
    PDF417ResultMetadata.prototype.setSegmentIndex = function (segmentIndex) {
        this.segmentIndex = segmentIndex;
    };
    /**
     * Is the same for each related PDF417 symbol
     *
     * @return File ID
     */
    PDF417ResultMetadata.prototype.getFileId = function () {
        return this.fileId;
    };
    PDF417ResultMetadata.prototype.setFileId = function (fileId) {
        this.fileId = fileId;
    };
    /**
     * @return always null
     * @deprecated use dedicated already parsed fields
     */
    //   @Deprecated
    PDF417ResultMetadata.prototype.getOptionalData = function () {
        return this.optionalData;
    };
    /**
     * @param optionalData old optional data format as int array
     * @deprecated parse and use new fields
     */
    //   @Deprecated
    PDF417ResultMetadata.prototype.setOptionalData = function (optionalData) {
        this.optionalData = optionalData;
    };
    /**
     * @return true if it is the last segment
     */
    PDF417ResultMetadata.prototype.isLastSegment = function () {
        return this.lastSegment;
    };
    PDF417ResultMetadata.prototype.setLastSegment = function (lastSegment) {
        this.lastSegment = lastSegment;
    };
    /**
     * @return count of segments, -1 if not set
     */
    PDF417ResultMetadata.prototype.getSegmentCount = function () {
        return this.segmentCount;
    };
    PDF417ResultMetadata.prototype.setSegmentCount = function (segmentCount /*int*/) {
        this.segmentCount = segmentCount;
    };
    PDF417ResultMetadata.prototype.getSender = function () {
        return this.sender || null;
    };
    PDF417ResultMetadata.prototype.setSender = function (sender) {
        this.sender = sender;
    };
    PDF417ResultMetadata.prototype.getAddressee = function () {
        return this.addressee || null;
    };
    PDF417ResultMetadata.prototype.setAddressee = function (addressee) {
        this.addressee = addressee;
    };
    /**
     * Filename of the encoded file
     *
     * @return filename
     */
    PDF417ResultMetadata.prototype.getFileName = function () {
        return this.fileName;
    };
    PDF417ResultMetadata.prototype.setFileName = function (fileName) {
        this.fileName = fileName;
    };
    /**
     * filesize in bytes of the encoded file
     *
     * @return filesize in bytes, -1 if not set
     */
    PDF417ResultMetadata.prototype.getFileSize = function () {
        return this.fileSize;
    };
    PDF417ResultMetadata.prototype.setFileSize = function (fileSize /*long*/) {
        this.fileSize = fileSize;
    };
    /**
     * 16-bit CRC checksum using CCITT-16
     *
     * @return crc checksum, -1 if not set
     */
    PDF417ResultMetadata.prototype.getChecksum = function () {
        return this.checksum;
    };
    PDF417ResultMetadata.prototype.setChecksum = function (checksum /*int*/) {
        this.checksum = checksum;
    };
    /**
     * unix epock timestamp, elapsed seconds since 1970-01-01
     *
     * @return elapsed seconds, -1 if not set
     */
    PDF417ResultMetadata.prototype.getTimestamp = function () {
        return this.timestamp;
    };
    PDF417ResultMetadata.prototype.setTimestamp = function (timestamp /*long*/) {
        this.timestamp = timestamp;
    };
    return PDF417ResultMetadata;
}());
export default PDF417ResultMetadata;
