import { extendTheme } from "@chakra-ui/react";
import { containerTheme } from "./container";

export default function createTheme(primaryColor: string = "#8DB600") {
  return extendTheme({
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
}
