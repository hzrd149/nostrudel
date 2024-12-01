import EBNF from "ebnf/dist/Grammars/W3CEBNF";
import { jsonQueryGrammar } from "./jsonQueryGrammar";
const valid = /(children|text|type|start|end|rest|errors|fullText|\d+)/;
const subset = /(children|text|type|\d+)/;
const toJSON = (ast) => JSON.stringify(ast, (key, value) => (key === "" || valid.test(key) ? value : undefined), 2);
const toSmallJSON = (ast) => JSON.stringify(ast, (key, value) => key === "" || (key === "rest" && value !== "") || subset.test(key)
    ? value
    : undefined, 2);
const parser = new EBNF.Parser(jsonQueryGrammar);
export const parse = (query) => parser.getAST(query);
export const reduce = (ast) => JSON.parse(toSmallJSON(ast));
export { toJSON };
