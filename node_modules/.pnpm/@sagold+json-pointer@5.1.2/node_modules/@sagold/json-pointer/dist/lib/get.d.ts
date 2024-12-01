import { JsonPointer, JsonPath, JsonData } from "./types";
/**
 * Fetch value at given json-pointer. Returns undefined, if no value can be
 * found at json-pointer
 *
 * @param data - json data to resolve json-pointer
 * @param pointer - json pointer to value
 * @param [defaultValue] - optional default value to return if json-pointer location does not exist
 * @return value at json-pointer, defaultValue if specified or undefined
 */
export declare function get<T = any>(data: JsonData, pointer: JsonPointer | JsonPath, defaultValue: T): T;
export declare function get<T = any>(data: JsonData, pointer: JsonPointer | JsonPath, defaultValue?: T): T | undefined;
