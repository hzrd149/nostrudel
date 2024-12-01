import DecodeHintType from '../DecodeHintType';
import CharacterSetECI from './CharacterSetECI';
import { int } from '../../customTypings';
import Charset from '../util/Charset';
/**
 * Common string-related functions.
 *
 * @author Sean Owen
 * @author Alex Dupre
 */
export default class StringUtils {
    static SHIFT_JIS: string;
    static GB2312: string;
    static ISO88591: string;
    private static EUC_JP;
    private static UTF8;
    private static PLATFORM_DEFAULT_ENCODING;
    private static ASSUME_SHIFT_JIS;
    static castAsNonUtf8Char(code: number, encoding?: Charset): string;
    /**
     * @param bytes bytes encoding a string, whose encoding should be guessed
     * @param hints decode hints if applicable
     * @return name of guessed encoding; at the moment will only guess one of:
     *  {@link #SHIFT_JIS}, {@link #UTF8}, {@link #ISO88591}, or the platform
     *  default encoding if none of these can possibly be correct
     */
    static guessEncoding(bytes: Uint8Array, hints: Map<DecodeHintType, any>): string;
    /**
     *
     * @see https://stackoverflow.com/a/13439711/4367683
     *
     * @param append The new string to append.
     * @param args Argumets values to be formated.
     */
    static format(append: string, ...args: any[]): string;
    /**
     *
     */
    static getBytes(str: string, encoding: CharacterSetECI): Uint8Array;
    /**
     * Returns the charcode at the specified index or at index zero.
     */
    static getCharCode(str: string, index?: number): int;
    /**
     * Returns char for given charcode
     */
    static getCharAt(charCode: number): string;
}
