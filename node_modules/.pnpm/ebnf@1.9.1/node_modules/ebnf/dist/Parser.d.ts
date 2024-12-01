import { TokenError } from './TokenError';
export declare type RulePrimary = string | RegExp;
export interface IRule {
    name: string;
    bnf: RulePrimary[][];
    recover?: string;
    fragment?: boolean;
    pinned?: number;
    implicitWs?: boolean;
    simplifyWhenOneChildren?: boolean;
}
export interface IToken {
    type: string;
    text: string;
    start: number;
    end: number;
    children: IToken[];
    parent: IToken;
    fullText: string;
    errors: TokenError[];
    rest: string;
    fragment?: boolean;
    lookup?: boolean;
}
export declare function readToken(txt: string, expr: RegExp): IToken;
export declare function escapeRegExp(str: any): any;
export declare function parseRuleName(name: string): {
    raw: string;
    name: string;
    isOptional: boolean;
    allowRepetition: boolean;
    atLeastOne: boolean;
    lookupPositive: boolean;
    lookupNegative: boolean;
    pinned: boolean;
    lookup: boolean;
    isLiteral: boolean;
};
export declare function findRuleByName(name: string, parser: Parser): IRule;
export interface IDictionary<T> {
    [s: string]: T;
}
export interface IParserOptions {
    keepUpperRules: boolean;
    debug: boolean;
}
export declare class Parser {
    grammarRules: IRule[];
    options?: Partial<IParserOptions>;
    private readonly debug;
    cachedRules: IDictionary<IRule>;
    constructor(grammarRules: IRule[], options?: Partial<IParserOptions>);
    getAST(txt: string, target?: string): IToken;
    emitSource(): string;
    parse(txt: string, target: string, recursion?: number): IToken;
    private parseRecovery;
}
export default Parser;
