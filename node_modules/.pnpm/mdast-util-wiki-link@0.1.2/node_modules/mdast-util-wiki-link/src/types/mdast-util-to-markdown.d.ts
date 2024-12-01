declare module 'mdast-util-to-markdown/lib/util/safe' {
  export interface SafeConfig {
    before?: string;
    after?: string;
    encode?: string[];
  }

  export interface State {
    unsafe: any[]; // Define more specific type if available
    stack: any[]; // Define more specific type if available
    compilePattern: (pattern: any) => RegExp; // Define more specific type if available
  }

  const safe: (state: State, input: string | null | undefined, config: SafeConfig) => string

  export default safe
}
