'use client'
import {
  useMenuStyles
} from "./chunk-UZJ3TPNQ.mjs";

// src/styled-menu-item.tsx
import { chakra, forwardRef } from "@chakra-ui/system";
import { useMemo } from "react";
import { jsx } from "react/jsx-runtime";
var StyledMenuItem = forwardRef(
  (props, ref) => {
    const { type, ...rest } = props;
    const styles = useMenuStyles();
    const btnType = rest.as || type ? type != null ? type : void 0 : "button";
    const buttonStyles = useMemo(
      () => ({
        textDecoration: "none",
        color: "inherit",
        userSelect: "none",
        display: "flex",
        width: "100%",
        alignItems: "center",
        textAlign: "start",
        flex: "0 0 auto",
        outline: 0,
        ...styles.item
      }),
      [styles.item]
    );
    return /* @__PURE__ */ jsx(chakra.button, { ref, type: btnType, ...rest, __css: buttonStyles });
  }
);

export {
  StyledMenuItem
};
//# sourceMappingURL=chunk-M565QO7N.mjs.map