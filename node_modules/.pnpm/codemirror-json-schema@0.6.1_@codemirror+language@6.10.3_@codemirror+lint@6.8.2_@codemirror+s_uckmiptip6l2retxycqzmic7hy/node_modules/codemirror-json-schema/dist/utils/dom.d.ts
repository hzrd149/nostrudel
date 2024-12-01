type Attributes = "class" | "text" | "id" | "role" | "aria-label" | "inner";
export declare function el(tagName: string, attributes: Partial<Record<Attributes, string>>, children?: HTMLElement[]): HTMLElement;
export {};
