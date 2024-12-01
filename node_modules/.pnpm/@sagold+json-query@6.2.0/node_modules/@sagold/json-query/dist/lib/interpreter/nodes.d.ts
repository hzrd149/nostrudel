import { IToken } from "ebnf";
declare const cache: {
    mem: any[];
    get(entry: any, prop: any): any[];
    reset(): void;
};
declare const expand: {
    any(node: IToken, entry: any): any[][];
    all(node: IToken, entry: any): any[];
    regex(node: IToken, entry: any): any[][];
};
declare const select: {
    escaped: (node: IToken, entry: any) => any[];
    property: (node: IToken, entry: any) => any[];
    typecheck: (node: IToken, entry: any) => any;
    lookahead: (node: IToken, entry: any) => any;
    expression: (node: IToken, entry: any) => any;
};
export { expand, select, cache };
