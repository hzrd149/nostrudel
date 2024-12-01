'use client'
import {
  useTabsStyles
} from "./chunk-GTRZJDIL.mjs";
import {
  useTabIndicator
} from "./chunk-NXSBASJ3.mjs";

// src/tab-indicator.tsx
import { cx } from "@chakra-ui/shared-utils";
import { chakra, forwardRef } from "@chakra-ui/system";
import { jsx } from "react/jsx-runtime";
var TabIndicator = forwardRef(
  function TabIndicator2(props, ref) {
    const indicatorStyle = useTabIndicator();
    const style = {
      ...props.style,
      ...indicatorStyle
    };
    const styles = useTabsStyles();
    return /* @__PURE__ */ jsx(
      chakra.div,
      {
        ref,
        ...props,
        className: cx("chakra-tabs__tab-indicator", props.className),
        style,
        __css: styles.indicator
      }
    );
  }
);
TabIndicator.displayName = "TabIndicator";

export {
  TabIndicator
};
//# sourceMappingURL=chunk-XYXC6MAF.mjs.map