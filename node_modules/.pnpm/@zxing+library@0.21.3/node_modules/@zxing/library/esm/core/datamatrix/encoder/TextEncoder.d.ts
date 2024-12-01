import StringBuilder from '../../util/StringBuilder';
import { char } from '../../../customTypings';
import { C40Encoder } from './C40Encoder';
export declare class TextEncoder extends C40Encoder {
    getEncodingMode(): number;
    encodeChar(c: char, sb: StringBuilder): number;
}
