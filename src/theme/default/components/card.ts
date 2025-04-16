import { cardAnatomy as parts } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers, cssVar } from "@chakra-ui/styled-system";

const { definePartsStyle, defineMultiStyleConfig } = createMultiStyleConfigHelpers(parts.keys);

const $bg = cssVar("card-bg");
// const $padding = cssVar("card-padding");
// const $shadow = cssVar("card-shadow");
// const $radius = cssVar("card-radius");
// const $border = cssVar("card-border-width", "0");
// const $borderColor = cssVar("card-border-color");

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
