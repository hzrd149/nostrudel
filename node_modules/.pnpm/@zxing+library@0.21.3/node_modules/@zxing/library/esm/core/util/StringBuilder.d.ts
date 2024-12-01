import CharacterSetECI from '../common/CharacterSetECI';
import { int, char } from '../../customTypings';
export default class StringBuilder {
    private value;
    private encoding;
    constructor(value?: string);
    enableDecoding(encoding: CharacterSetECI): StringBuilder;
    append(s: string | number): StringBuilder;
    appendChars(str: char[] | string[], offset: int, len: int): StringBuilder;
    length(): number;
    charAt(n: number): string;
    deleteCharAt(n: number): void;
    setCharAt(n: number, c: string): void;
    substring(start: int, end: int): string;
    /**
     * @note helper method for RSS Expanded
     */
    setLengthToZero(): void;
    toString(): string;
    insert(n: number, c: string): void;
}
