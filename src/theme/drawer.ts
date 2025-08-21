import { createMultiStyleConfigHelpers } from "@chakra-ui/react";
import { drawerAnatomy } from "@chakra-ui/anatomy";

const { definePartsStyle, defineMultiStyleConfig } = createMultiStyleConfigHelpers(drawerAnatomy.keys);
const drawerBase = definePartsStyle({
  dialog: {
    // paddingTop: "var(--safe-top)",
    // paddingBottom: "var(--safe-top)",
  },
  closeButton: {
    // top: "calc(var(--chakra-space-2) + var(--safe-top))",
    // right: "calc(var(--chakra-space-3) + var(--safe-right))",
  },
});
export const drawerTheme = defineMultiStyleConfig({ baseStyle: drawerBase });
