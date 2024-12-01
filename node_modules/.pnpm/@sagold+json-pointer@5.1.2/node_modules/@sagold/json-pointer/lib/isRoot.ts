import { JsonPointer, JsonPath } from "./types";

/**
 * @returns true, if this pointer location is the root data
 */
export function isRoot(pointer: JsonPointer | JsonPath): boolean {
	return (
		pointer === "#" ||
		pointer === "" ||
		(Array.isArray(pointer) && pointer.length === 0) ||
		false
	);
}
