import { Input } from "./types";
export declare enum InsertMode {
    REPLACE_ITEMS = "replace",
    INSERT_ITEMS = "insert"
}
/**
 * Runs query on input data and assigns a value to query-results.
 * @param data - input data
 * @param queryString - json-query string
 * @param value - value to assign
 * @param [force] - whether to replace or insert into arrays
 */
export declare function set<T extends Input>(data: T, queryString: string, value: any, force?: InsertMode): T;
export declare namespace set {
    var REPLACE_ITEMS: InsertMode;
    var INSERT_ITEMS: InsertMode;
}
