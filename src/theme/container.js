import { defineStyle, defineStyleConfig } from "@chakra-ui/react";

// define custom sizes
const sizes = {
  sm: defineStyle({
    maxW: "10rem",
  }),
  md: defineStyle({
    maxW: "50rem",
  }),
  lg: defineStyle({
    maxW: "100rem",
  }),
};

// export the component theme
export const containerTheme = defineStyleConfig({ sizes });
