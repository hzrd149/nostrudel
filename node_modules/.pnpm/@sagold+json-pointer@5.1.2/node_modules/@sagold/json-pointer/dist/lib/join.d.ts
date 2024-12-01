import { JsonPointer, JsonPath } from "./types";
/**
 * Convert a list of JsonPointers, or a single JsonPath to a valid json-pointer
 *
 * Supports as input:
 * 	- a json-path
 * 	- a list of json-pointers
 * 	- relative json-pointers
 *
 * If the last parameter is a boolean and set to true, a URIFragment is
 * returned (leading `#/`)
 *
 * # examples
 *
 *	`join(["metadata", "title"])` // "metadata/title"
 *	`join(["metadata", "title"], true)` // "#/metadata/title"
 *	`join("metadata", "title")` // "metadata/title"
 *	`join("#/metadata", "title")` // "#/metadata/title"
 *	`join("metadata", "title", true)` // "#/metadata/title"
 *	`join("metadata", "../title")` // "title"
 */
export declare function join(firstPointer: JsonPointer | JsonPath, ...args: any[]): JsonPointer;
