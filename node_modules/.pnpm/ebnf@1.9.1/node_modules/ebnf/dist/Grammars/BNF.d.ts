import { IRule, Parser as _Parser } from '../Parser';
import { IGrammarParserOptions } from './types';
declare namespace BNF {
    const RULES: IRule[];
    const defaultParser: _Parser;
    function getRules(source: string, parser?: _Parser): IRule[];
    function Transform(source: TemplateStringsArray, subParser?: _Parser): IRule[];
    class Parser extends _Parser {
        private readonly source;
        constructor(source: string, options?: Partial<IGrammarParserOptions>);
        emitSource(): string;
    }
}
export default BNF;
