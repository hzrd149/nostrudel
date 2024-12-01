import { IToken } from "ebnf";
declare const toJSON: (ast: any) => string;
export declare const parse: (query: any) => IToken;
export declare const reduce: (ast: IToken) => any;
export { toJSON };
