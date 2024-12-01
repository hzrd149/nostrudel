/**
 * Runs query on input data and removes matching properties from results
 * @param data - input data
 * @param queryString - json-query string
 * @param [returnRemoved] - if true, will returned removed properties, else input-data is removed
 */
export declare function remove(data: any, queryString: any, returnRemoved?: boolean): any;
