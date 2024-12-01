type AccessorFn = (item: any) => any;

declare function accessor(
  accessorParam: string | AccessorFn | any
): AccessorFn;

export { accessor as default };
