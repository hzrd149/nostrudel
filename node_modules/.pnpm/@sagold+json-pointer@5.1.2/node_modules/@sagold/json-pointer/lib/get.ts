import { split } from "./split";
import { isRoot } from "./isRoot";
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
export function get<T = any>( data: JsonData, pointer: JsonPointer | JsonPath, defaultValue: T): T ;
export function get<T = any>( data: JsonData, pointer: JsonPointer | JsonPath, defaultValue?: T): T | undefined ;
export function get<T = any>( data: JsonData, pointer: JsonPointer | JsonPath, defaultValue = undefined): T | undefined  {
	if (pointer == null || data == null) {
		return defaultValue;
	}
	if (isRoot(pointer)) {
		return data;
	}
	const result = run(data, split(pointer));
	if (result === undefined) {
		return defaultValue;
	}
	return result;
}

function run<T = any>(data: JsonData, path: JsonPath): T | undefined {
	const property = path.shift();
	if (data === undefined) {
		return;
	} else if (property !== undefined) {
		return run(data[property], path);
	}
	return data;
}
