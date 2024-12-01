/**
 * Removes all `undefined` values within an array without creating additional
 * arrays
 */
export function removeUndefinedItems<T = any>(array: Array<T>): Array<T> {
	let i = 0;
	let skip = 0;
	while (i + skip < array.length) {
		if (array[i + skip] === undefined) {
			skip += 1;
		}
		array[i] = array[i + skip];
		i += 1;
	}
	array.length = array.length - skip;
	return array;
}
