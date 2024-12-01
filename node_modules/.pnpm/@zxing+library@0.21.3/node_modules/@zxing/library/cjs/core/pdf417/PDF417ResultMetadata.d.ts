/**
 * @author Guenther Grau
 */
export default class PDF417ResultMetadata {
    private segmentIndex;
    private fileId;
    private lastSegment;
    private segmentCount;
    private sender;
    private addressee;
    private fileName;
    private fileSize;
    private timestamp;
    private checksum;
    private optionalData;
    /**
     * The Segment ID represents the segment of the whole file distributed over different symbols.
     *
     * @return File segment index
     */
    getSegmentIndex(): number;
    setSegmentIndex(segmentIndex: number): void;
    /**
     * Is the same for each related PDF417 symbol
     *
     * @return File ID
     */
    getFileId(): string;
    setFileId(fileId: string): void;
    /**
     * @return always null
     * @deprecated use dedicated already parsed fields
     */
    getOptionalData(): Int32Array;
    /**
     * @param optionalData old optional data format as int array
     * @deprecated parse and use new fields
     */
    setOptionalData(optionalData: Int32Array): void;
    /**
     * @return true if it is the last segment
     */
    isLastSegment(): boolean;
    setLastSegment(lastSegment: boolean): void;
    /**
     * @return count of segments, -1 if not set
     */
    getSegmentCount(): number;
    setSegmentCount(segmentCount: number): void;
    getSender(): string;
    setSender(sender: string): void;
    getAddressee(): string;
    setAddressee(addressee: string): void;
    /**
     * Filename of the encoded file
     *
     * @return filename
     */
    getFileName(): string;
    setFileName(fileName: string): void;
    /**
     * filesize in bytes of the encoded file
     *
     * @return filesize in bytes, -1 if not set
     */
    getFileSize(): number;
    setFileSize(fileSize: number): void;
    /**
     * 16-bit CRC checksum using CCITT-16
     *
     * @return crc checksum, -1 if not set
     */
    getChecksum(): number;
    setChecksum(checksum: number): void;
    /**
     * unix epock timestamp, elapsed seconds since 1970-01-01
     *
     * @return elapsed seconds, -1 if not set
     */
    getTimestamp(): number;
    setTimestamp(timestamp: number): void;
}
