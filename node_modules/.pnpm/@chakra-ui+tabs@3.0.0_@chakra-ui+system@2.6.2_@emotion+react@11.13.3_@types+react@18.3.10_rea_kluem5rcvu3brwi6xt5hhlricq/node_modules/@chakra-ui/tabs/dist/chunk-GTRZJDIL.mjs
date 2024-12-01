'use client'
import {
  TabsDescendantsProvider,
  TabsProvider,
  useTabs
} from "./chunk-NXSBASJ3.mjs";

// src/tabs.tsx
import { createContext } from "@chakra-ui/react-context";
import {
  chakra,
  forwardRef,
  omitThemingProps,
  useMultiStyleConfig
} from "@chakra-ui/system";
import { cx } from "@chakra-ui/shared-utils";
import { useMemo } from "react";
import { jsx } from "react/jsx-runtime";
var [TabsStylesProvider, useTabsStyles] = createContext({
  name: `TabsStylesContext`,
  errorMessage: `useTabsStyles returned is 'undefined'. Seems you forgot to wrap the components in "<Tabs />" `
});
var Tabs = forwardRef(function Tabs2(props, ref) {
  const styles = useMultiStyleConfig("Tabs", props);
  const { children, className, ...rest } = omitThemingProps(props);
  const { htmlProps, descendants, ...ctx } = useTabs(rest);
  const context = useMemo(() => ctx, [ctx]);
  const { isFitted: _, ...rootProps } = htmlProps;
  const tabsStyles = {
    position: "relative",
    ...styles.root
  };
  return /* @__PURE__ */ jsx(TabsDescendantsProvider, { value: descendants, children: /* @__PURE__ */ jsx(TabsProvider, { value: context, children: /* @__PURE__ */ jsx(TabsStylesProvider, { value: styles, children: /* @__PURE__ */ jsx(
    chakra.div,
    {
      className: cx("chakra-tabs", className),
      ref,
      ...rootProps,
      __css: tabsStyles,
      children
    }
  ) }) }) });
});
Tabs.displayName = "Tabs";

export {
  useTabsStyles,
  Tabs
};
//# sourceMappingURL=chunk-GTRZJDIL.mjs.map