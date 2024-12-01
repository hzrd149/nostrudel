import { isRoot } from "./isRoot";
import { JsonPointer, JsonPath } from "./types";

const matchSlashes = /~1/g;
const matchTildes = /~0/g;
const matchMutlipleSlashes = /\/+/g;
const matchPointerPrefixes = /(^[#/]*|\/+$)/g;

function sanitizeProperty(property: string): string {
	return property.replace(matchSlashes, "/").replace(matchTildes, "~");
}

function sanitizeAndDecodeProperty(property: string): string {
	return sanitizeProperty(decodeURIComponent(property));
}

/**
 * From a json-pointer, creates an array of properties, describing a path into
 * json-data
 */
export function split(pointer: JsonPointer | JsonPath): JsonPath {
	if (pointer == null || typeof pointer !== "string" || isRoot(pointer)) {
		return Array.isArray(pointer) ? pointer : [];
	}
	const sanitize =
		pointer.indexOf("#") >= 0
			? sanitizeAndDecodeProperty
			: sanitizeProperty;
	pointer = pointer.replace(matchMutlipleSlashes, "/");
	pointer = pointer.replace(matchPointerPrefixes, "");

	const result = pointer.split("/");
	for (let i = 0, l = result.length; i < l; i += 1) {
		result[i] = sanitize(result[i]);
	}
	return result;
}
