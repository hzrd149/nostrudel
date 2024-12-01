type Obj = any;

declare class ColorTracker {
  constructor(bits?: number);

  register(obj: Obj): string | null;
  lookup(color: string | [number, number, number]): Obj | null;
  reset(): void;
}

export { ColorTracker as default };
