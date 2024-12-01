import StringBuilder from '../../util/StringBuilder';
import { char } from '../../../customTypings';
import { Encoder } from './Encoder';
import { EncoderContext } from './EncoderContext';
export declare class C40Encoder implements Encoder {
    getEncodingMode(): number;
    encodeMaximal(context: EncoderContext): void;
    encode(context: EncoderContext): void;
    backtrackOneCharacter(context: EncoderContext, buffer: StringBuilder, removed: StringBuilder, lastCharSize: number): number;
    writeNextTriplet(context: EncoderContext, buffer: StringBuilder): void;
    /**
     * Handle "end of data" situations
     *
     * @param context the encoder context
     * @param buffer  the buffer with the remaining encoded characters
     */
    handleEOD(context: EncoderContext, buffer: StringBuilder): void;
    encodeChar(c: char, sb: StringBuilder): number;
    private encodeToCodewords;
}
