import { split } from "./split";
import { JsonPointer, JsonPath, JsonData } from "./types";

const isArray = /^\[.*\]$/;
const arrayIndex = /^\[(.+)\]$/;

function accessToPrototype(key: string, properties: string[]) {
	return (
		key === "__proto__" ||
		(key == "constructor" &&
			properties.length > 0 &&
			properties[0] == "prototype")
	);
}

export function set<T = JsonData>(
	data: T,
	pointer: JsonPointer | JsonPath,
	value: any
): T {
	if (pointer == null) {
		return data;
	}

	const properties = split(pointer);
	if (properties.length === 0) {
		return data;
	}

	if (data == null) {
		data = (isArray.test(properties[0]) ? [] : {}) as T;
	}

	let key,
		nextKeyIsArray,
		current = data;
	while (properties.length > 1) {
		key = properties.shift();
		nextKeyIsArray = isArray.test(properties[0]);
		if (accessToPrototype(key, properties)) {
			continue;
		}
		current = create(current, key, nextKeyIsArray);
	}
	key = properties.pop();
	addValue(current, key, value);
	return data;
}

function addValue(data, key, value) {
	let index;
	const keyAsIndex = key.match(arrayIndex);
	if (key === "[]" && Array.isArray(data)) {
		data.push(value);
	} else if (keyAsIndex) {
		index = keyAsIndex.pop();
		data[index] = value;
	} else {
		data[key] = value;
	}
}

function create(data, key, isArray) {
	if (data[key] != null) {
		return data[key];
	}
	const value = isArray ? [] : {};
	addValue(data, key, value);
	return value;
}
