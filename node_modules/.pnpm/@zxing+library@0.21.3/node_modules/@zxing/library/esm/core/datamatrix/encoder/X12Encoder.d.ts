import { char } from '../../../customTypings';
import StringBuilder from '../../util/StringBuilder';
import { C40Encoder } from './C40Encoder';
import { EncoderContext } from './EncoderContext';
export declare class X12Encoder extends C40Encoder {
    getEncodingMode(): number;
    encode(context: EncoderContext): void;
    encodeChar(c: char, sb: StringBuilder): number;
    handleEOD(context: EncoderContext, buffer: StringBuilder): void;
}
