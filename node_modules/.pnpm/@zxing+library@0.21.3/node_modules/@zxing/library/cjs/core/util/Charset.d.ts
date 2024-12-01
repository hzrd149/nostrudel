import CharacterSetECI from '../common/CharacterSetECI';
/**
 * Just to make a shortcut between Java code and TS code.
 */
export default class Charset extends CharacterSetECI {
    static forName(name: string): Charset;
}
