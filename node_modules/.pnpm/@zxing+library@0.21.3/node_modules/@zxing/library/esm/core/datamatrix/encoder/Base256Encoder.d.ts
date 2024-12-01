import { Encoder } from './Encoder';
import { EncoderContext } from './EncoderContext';
export declare class Base256Encoder implements Encoder {
    getEncodingMode(): number;
    encode(context: EncoderContext): void;
    private randomize255State;
}
