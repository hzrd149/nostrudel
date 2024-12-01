import { JsonPointer, JsonPath, JsonData } from "./types";
export declare function set<T = JsonData>(data: T, pointer: JsonPointer | JsonPath, value: any): T;
