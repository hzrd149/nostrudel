import { Encoder } from './Encoder';
import { EncoderContext } from './EncoderContext';
export declare class EdifactEncoder implements Encoder {
    getEncodingMode(): number;
    encode(context: EncoderContext): void;
    /**
     * Handle "end of data" situations
     *
     * @param context the encoder context
     * @param buffer  the buffer with the remaining encoded characters
     */
    private handleEOD;
    private encodeChar;
    private encodeToCodewords;
}
