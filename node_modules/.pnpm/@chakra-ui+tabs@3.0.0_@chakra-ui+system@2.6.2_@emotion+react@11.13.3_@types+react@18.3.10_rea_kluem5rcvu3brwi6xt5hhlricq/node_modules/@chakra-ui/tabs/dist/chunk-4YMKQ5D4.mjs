'use client'
import {
  useTabsStyles
} from "./chunk-GTRZJDIL.mjs";
import {
  useTabPanels
} from "./chunk-NXSBASJ3.mjs";

// src/tab-panels.tsx
import { cx } from "@chakra-ui/shared-utils";
import { chakra, forwardRef } from "@chakra-ui/system";
import { jsx } from "react/jsx-runtime";
var TabPanels = forwardRef(function TabPanels2(props, ref) {
  const panelsProps = useTabPanels(props);
  const styles = useTabsStyles();
  return /* @__PURE__ */ jsx(
    chakra.div,
    {
      ...panelsProps,
      width: "100%",
      ref,
      className: cx("chakra-tabs__tab-panels", props.className),
      __css: styles.tabpanels
    }
  );
});
TabPanels.displayName = "TabPanels";

export {
  TabPanels
};
//# sourceMappingURL=chunk-4YMKQ5D4.mjs.map