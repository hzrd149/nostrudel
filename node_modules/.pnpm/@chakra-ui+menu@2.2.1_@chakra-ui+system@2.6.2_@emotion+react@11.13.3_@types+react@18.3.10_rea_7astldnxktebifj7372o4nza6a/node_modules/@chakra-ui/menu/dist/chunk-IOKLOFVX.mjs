'use client'
import {
  MenuGroup
} from "./chunk-PTXXWAJU.mjs";
import {
  useMenuOptionGroup
} from "./chunk-SANI5SUM.mjs";

// src/menu-option-group.tsx
import { cx } from "@chakra-ui/shared-utils";
import { jsx } from "react/jsx-runtime";
var MenuOptionGroup = (props) => {
  const { className, title, ...rest } = props;
  const ownProps = useMenuOptionGroup(rest);
  return /* @__PURE__ */ jsx(
    MenuGroup,
    {
      title,
      className: cx("chakra-menu__option-group", className),
      ...ownProps
    }
  );
};
MenuOptionGroup.displayName = "MenuOptionGroup";

export {
  MenuOptionGroup
};
//# sourceMappingURL=chunk-IOKLOFVX.mjs.map