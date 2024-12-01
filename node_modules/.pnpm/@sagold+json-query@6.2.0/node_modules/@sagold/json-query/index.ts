import { get, ReturnType, ResultCallback } from "./lib/get";
import { set } from "./lib/set";
import { split } from "./lib/split";
import { remove } from "./lib/remove";

export { get, set, split, remove, ReturnType };
export default { get, set, split, remove, ReturnType };

export type { ResultCallback };
export type { Input, JsonPointer, QueryResult } from "./lib/types";
