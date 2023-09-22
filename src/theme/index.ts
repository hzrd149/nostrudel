import { extendTheme } from "@chakra-ui/react";
import { containerTheme } from "./container";

const breakpoints = ["sm", "md", "lg", "xl", "2xl"] as const;

export default function createTheme(primaryColor: string = "#8DB600", maxBreakpoint?: (typeof breakpoints)[number]) {
  const theme = extendTheme({
    colors: {
      brand: {
        50: primaryColor,
        100: primaryColor,
        200: primaryColor,
        300: primaryColor,
        400: primaryColor,
        500: primaryColor,
        600: primaryColor,
        700: primaryColor,
        800: primaryColor,
        900: primaryColor,
      },
    },
    components: {
      Container: containerTheme,
    },
  });

  // if maxBreakpoint is set, set all breakpoints above it to a large number so they are never reached
  if (maxBreakpoint && breakpoints.includes(maxBreakpoint)) {
    for (let i = breakpoints.indexOf(maxBreakpoint) + 1; i < breakpoints.length; i++) {
      theme.breakpoints[breakpoints[i]] = 50000;
    }
  }

  return theme;
}
