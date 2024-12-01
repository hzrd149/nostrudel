import { JsonPointer, JsonPath } from "./types";
/**
 * From a json-pointer, creates an array of properties, describing a path into
 * json-data
 */
export declare function split(pointer: JsonPointer | JsonPath): JsonPath;
