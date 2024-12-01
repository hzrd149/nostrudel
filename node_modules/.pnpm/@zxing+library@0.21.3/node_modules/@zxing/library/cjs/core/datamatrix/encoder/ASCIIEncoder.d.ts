import { Encoder } from './Encoder';
import { EncoderContext } from './EncoderContext';
export declare class ASCIIEncoder implements Encoder {
    getEncodingMode(): number;
    encode(context: EncoderContext): void;
    private encodeASCIIDigits;
}
