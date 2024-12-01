import { JsonPointer, JsonPath } from "./types";
/**
 * splits the last property of json-pointer and returns the path and property.
 * @returns tuple with parent json-pointer and the last property or undefined if pointer a root pointer
 */
export declare function splitLast(pointer: JsonPointer | JsonPath): [string, string | undefined];
