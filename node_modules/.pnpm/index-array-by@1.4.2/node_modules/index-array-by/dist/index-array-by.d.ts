type ListItem = any;

type KeyAccessor = string | ((listItem: ListItem) => string);

type ReducerFn = (items: ListItem[]) => any;

interface NestedResult {
  [key: string]: NestedResult | ListItem | ListItem[];
}

type FlatResult = {
  keys: string[];
  vals: ListItem | ListItem[]
}[];

declare function indexBy(
  list: ListItem[],
  keyAccessors: KeyAccessor | KeyAccessor[],
  multiItem?: boolean | ReducerFn,
  flattenKeys?: boolean
): NestedResult | FlatResult;

export { indexBy as default };
