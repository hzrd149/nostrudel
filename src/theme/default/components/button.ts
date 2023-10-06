import { defineStyle, defineStyleConfig } from "@chakra-ui/styled-system";
import { mode } from "@chakra-ui/theme-tools";

// https://github.com/chakra-ui/chakra-ui/blob/main/packages/components/theme/src/components/button.ts

const variantLink = defineStyle((props) => {
  const { colorScheme: c } = props;
  return {
    color: c === "gray" ? "colors.chakra-body-text" : mode(`${c}.500`, `${c}.200`)(props),
  };
});

export const buttonTheme = defineStyleConfig({
  variants: {
    link: variantLink,
  },
});
