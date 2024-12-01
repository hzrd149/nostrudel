import { JsonPointer, JsonPath } from "./types";
/**
 * @returns true, if this pointer location is the root data
 */
export declare function isRoot(pointer: JsonPointer | JsonPath): boolean;
