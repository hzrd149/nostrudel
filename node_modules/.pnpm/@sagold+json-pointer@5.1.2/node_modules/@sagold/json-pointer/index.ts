import { get } from "./lib/get";
import { set } from "./lib/set";
import { remove } from "./lib/remove";
import { join } from "./lib/join";
import { split } from "./lib/split";
import { splitLast } from "./lib/splitLast";
import { isRoot } from "./lib/isRoot";
import { removeUndefinedItems } from "./lib/removeUndefinedItems";
import { JsonPointer, JsonPath, JsonData } from "./lib/types";

const jsonPointer = {
	get,
	set,
	remove,
	join,
	split,
	splitLast,
	isRoot,
	removeUndefinedItems,
};
export default jsonPointer;
export {
	get,
	set,
	remove,
	join,
	split,
	splitLast,
	isRoot,
	removeUndefinedItems,
};

export type { JsonPointer, JsonPath, JsonData };
