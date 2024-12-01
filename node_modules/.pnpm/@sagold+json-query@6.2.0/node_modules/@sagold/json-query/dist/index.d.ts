import { get, ReturnType, ResultCallback } from "./lib/get";
import { set } from "./lib/set";
import { split } from "./lib/split";
import { remove } from "./lib/remove";
export { get, set, split, remove, ReturnType };
declare const _default: {
    get: typeof get;
    set: typeof set;
    split: typeof split;
    remove: typeof remove;
    ReturnType: typeof ReturnType;
};
export default _default;
export type { ResultCallback };
export type { Input, JsonPointer, QueryResult } from "./lib/types";
