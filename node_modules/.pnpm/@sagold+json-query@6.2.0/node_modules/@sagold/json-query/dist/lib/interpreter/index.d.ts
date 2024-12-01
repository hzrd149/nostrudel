import { VALUE_INDEX, KEY_INDEX, PARENT_INDEX, POINTER_INDEX } from "./keys";
import { QueryResult, Input } from "../types";
import { IToken } from "ebnf";
export declare function run(data: Input, ast: IToken): Array<QueryResult>;
export { VALUE_INDEX, KEY_INDEX, PARENT_INDEX, POINTER_INDEX };
