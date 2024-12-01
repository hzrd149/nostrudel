import * as react_jsx_runtime from 'react/jsx-runtime';

declare const CSSPolyfill: () => react_jsx_runtime.JSX.Element;
type CSSResetProps = {
    /**
     * The selector to scope the css reset styles to.
     */
    scope?: string;
};
declare const CSSReset: ({ scope }: CSSResetProps) => react_jsx_runtime.JSX.Element;

export { CSSPolyfill, CSSReset, CSSResetProps, CSSReset as default };
