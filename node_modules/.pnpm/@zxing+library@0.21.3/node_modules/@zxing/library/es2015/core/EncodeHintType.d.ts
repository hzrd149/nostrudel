/**
 * These are a set of hints that you may pass to Writers to specify their behavior.
 *
 * @author dswitkin@google.com (Daniel Switkin)
 */
declare enum EncodeHintType {
    /**
     * Specifies what degree of error correction to use, for example in QR Codes.
     * Type depends on the encoder. For example for QR codes it's type
     * {@link com.google.zxing.qrcode.decoder.ErrorCorrectionLevel ErrorCorrectionLevel}.
     * For Aztec it is of type {@link Integer}, representing the minimal percentage of error correction words.
     * For PDF417 it is of type {@link Integer}, valid values being 0 to 8.
     * In all cases, it can also be a {@link String} representation of the desired value as well.
     * Note: an Aztec symbol should have a minimum of 25% EC words.
     */
    ERROR_CORRECTION = 0,
    /**
     * Specifies what character encoding to use where applicable (type {@link String})
     */
    CHARACTER_SET = 1,
    /**
     * Specifies the matrix shape for Data Matrix (type {@link com.google.zxing.datamatrix.encoder.SymbolShapeHint})
     */
    DATA_MATRIX_SHAPE = 2,
    /**
     * Specifies whether to use compact mode for Data Matrix (type {@link Boolean}, or "true" or "false"
     * {@link String } value).
     * The compact encoding mode also supports the encoding of characters that are not in the ISO-8859-1
     * character set via ECIs.
     * Please note that in that case, the most compact character encoding is chosen for characters in
     * the input that are not in the ISO-8859-1 character set. Based on experience, some scanners do not
     * support encodings like cp-1256 (Arabic). In such cases the encoding can be forced to UTF-8 by
     * means of the {@link #CHARACTER_SET} encoding hint.
     * Compact encoding also provides GS1-FNC1 support when {@link #GS1_FORMAT} is selected. In this case
     * group-separator character (ASCII 29 decimal) can be used to encode the positions of FNC1 codewords
     * for the purpose of delimiting AIs.
     * This option and {@link #FORCE_C40} are mutually exclusive.
     */
    DATA_MATRIX_COMPACT = 3,
    /**
     * Specifies a minimum barcode size (type {@link Dimension}). Only applicable to Data Matrix now.
     *
     * @deprecated use width/height params in
     * {@link com.google.zxing.datamatrix.DataMatrixWriter#encode(String, BarcodeFormat, int, int)}
     */
    MIN_SIZE = 4,
    /**
     * Specifies a maximum barcode size (type {@link Dimension}). Only applicable to Data Matrix now.
     *
     * @deprecated without replacement
     */
    MAX_SIZE = 5,
    /**
     * Specifies margin, in pixels, to use when generating the barcode. The meaning can vary
     * by format; for example it controls margin before and after the barcode horizontally for
     * most 1D formats. (Type {@link Integer}, or {@link String} representation of the integer value).
     */
    MARGIN = 6,
    /**
     * Specifies whether to use compact mode for PDF417 (type {@link Boolean}, or "true" or "false"
     * {@link String} value).
     */
    PDF417_COMPACT = 7,
    /**
     * Specifies what compaction mode to use for PDF417 (type
     * {@link com.google.zxing.pdf417.encoder.Compaction Compaction} or {@link String} value of one of its
     * enum values).
     */
    PDF417_COMPACTION = 8,
    /**
     * Specifies the minimum and maximum number of rows and columns for PDF417 (type
     * {@link com.google.zxing.pdf417.encoder.Dimensions Dimensions}).
     */
    PDF417_DIMENSIONS = 9,
    /**
     * Specifies the required number of layers for an Aztec code.
     * A negative number (-1, -2, -3, -4) specifies a compact Aztec code.
     * 0 indicates to use the minimum number of layers (the default).
     * A positive number (1, 2, .. 32) specifies a normal (non-compact) Aztec code.
     * (Type {@link Integer}, or {@link String} representation of the integer value).
     */
    AZTEC_LAYERS = 10,
    /**
     * Specifies the exact version of QR code to be encoded.
     * (Type {@link Integer}, or {@link String} representation of the integer value).
     */
    QR_VERSION = 11,
    /**
     * Specifies whether the data should be encoded to the GS1 standard (type {@link Boolean}, or "true" or "false"
     * {@link String } value).
     */
    GS1_FORMAT = 12,
    /**
     * Forces C40 encoding for data-matrix (type {@link Boolean}, or "true" or "false") {@link String } value). This
     * option and {@link #DATA_MATRIX_COMPACT} are mutually exclusive.
     */
    FORCE_C40 = 13
}
export default EncodeHintType;
