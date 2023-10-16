import { menuAnatomy as parts } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers, cssVar, defineStyle } from "@chakra-ui/styled-system";

// https://github.com/chakra-ui/chakra-ui/blob/main/packages/components/theme/src/components/menu.ts

const { defineMultiStyleConfig, definePartsStyle } = createMultiStyleConfigHelpers(parts.keys);

const $bg = cssVar("menu-bg");

const baseStyleList = defineStyle({
  [$bg.variable]: "#fff",
  _dark: {
    [$bg.variable]: "colors.gray.800",
  },
});

const baseStyle = definePartsStyle({
  list: baseStyleList,
});

export const menuTheme = defineMultiStyleConfig({
  baseStyle,
});
