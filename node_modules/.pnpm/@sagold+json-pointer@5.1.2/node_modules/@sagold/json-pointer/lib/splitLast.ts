import { split } from "./split";
import { join } from "./join";
import { JsonPointer, JsonPath } from "./types";

/**
 * splits the last property of json-pointer and returns the path and property.
 * @returns tuple with parent json-pointer and the last property or undefined if pointer a root pointer
 */
export function splitLast(
	pointer: JsonPointer | JsonPath
): [string, string | undefined] {
	const path = split(pointer);
	if (path.length === 0) {
		if (typeof pointer === "string" && pointer[0] === "#") {
			return ["#", path[0]];
		}
		return ["", undefined];
	}
	if (path.length === 1) {
		if (pointer[0] === "#") {
			return ["#", path[0]];
		}
		return ["", path[0]];
	}
	const lastProperty = path.pop();
	return [join(path, pointer[0] === "#"), lastProperty];
}
