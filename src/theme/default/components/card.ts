import { cardAnatomy as parts } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers, cssVar } from "@chakra-ui/styled-system";

const { definePartsStyle, defineMultiStyleConfig } = createMultiStyleConfigHelpers(parts.keys);

const $bg = cssVar("card-bg");

export const cardTheme = defineMultiStyleConfig({
  baseStyle: {},
  variants: {
    elevated: definePartsStyle({
      container: {
        _dark: {
          [$bg.variable]: "colors.chakra-subtle-bg",
        },
      },
    }),
    filled: definePartsStyle({
      container: {
        [$bg.variable]: "colors.chakra-subtle-bg",
      },
    }),
  },
});
