import { defineStyle, defineStyleConfig } from "@chakra-ui/styled-system";
import { mode } from "@chakra-ui/theme-tools";

// https://github.com/chakra-ui/chakra-ui/blob/main/packages/components/theme/src/components/button.ts

const variantLink = defineStyle((props) => {
  const { colorScheme: c } = props;
  return {
    color: c === "gray" ? "colors.chakra-body-text" : mode(`${c}.500`, `${c}.200`)(props),
  };
});

const variantSolid = defineStyle((props) => {
  const { colorScheme: c } = props;

  // copy of https://github.com/chakra-ui/chakra-ui/blob/main/packages/components/theme/src/components/button.ts#L94-L108
  if (c === "gray") {
    const bg = mode(`gray.50`, `whiteAlpha.200`)(props);

    return {
      bg,
      _hover: {
        bg: mode(`gray.100`, `whiteAlpha.300`)(props),
        _disabled: { bg },
      },
      _active: { bg: mode(`gray.200`, `whiteAlpha.400`)(props) },
    };
  }

  return {};
});

export const buttonTheme = defineStyleConfig({
  variants: {
    link: variantLink,
    solid: variantSolid,
  },
});
