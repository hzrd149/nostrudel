// https://github.com/chakra-ui/chakra-ui/blob/main/packages/components/theme/src/components/modal.ts

import { modalAnatomy as parts } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers, cssVar, defineStyle } from "@chakra-ui/styled-system";

const { defineMultiStyleConfig, definePartsStyle } = createMultiStyleConfigHelpers(parts.keys);

const $bg = cssVar("modal-bg");

const baseStyleDialog = defineStyle({
  [$bg.variable]: "colors.white",
  _dark: {
    [$bg.variable]: "colors.gray.800",
  },
});

const baseStyle = definePartsStyle({
  dialog: baseStyleDialog,
});

export const modalTheme = defineMultiStyleConfig({
  baseStyle,
});
