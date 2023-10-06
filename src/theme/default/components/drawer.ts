import { drawerAnatomy as parts } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers, cssVar } from "@chakra-ui/styled-system";

const { definePartsStyle, defineMultiStyleConfig } = createMultiStyleConfigHelpers(parts.keys);

const $bg = cssVar("drawer-bg");

export const drawerTheme = defineMultiStyleConfig({
  baseStyle: definePartsStyle({
    dialog: {
      _dark: {
        [$bg.variable]: "colors.gray.800",
      },
    },
  }),
});
