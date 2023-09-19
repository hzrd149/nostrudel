import { defineStyle, defineStyleConfig } from "@chakra-ui/react";

// define custom sizes
const sizes = {
  sm: defineStyle({
    maxW: "30em",
  }),
  md: defineStyle({
    maxW: "48em",
  }),
  lg: defineStyle({
    maxW: "62em",
  }),
  xl: defineStyle({
    maxW: "80em",
  }),
  "2xl": defineStyle({
    maxW: "96em",
  }),
};

// export the component theme
export const containerTheme = defineStyleConfig({ sizes });
