import { extendTheme } from "@chakra-ui/react";
import { containerTheme } from "./container";

const theme = extendTheme({
  colors: {
    // https://hihayk.github.io/scale/#5/4/60/50/0/0/20/-25/8DB600/141/182/0/white
    brand: {
      50: "#334009",
      100: "#44550A",
      200: "#556C09",
      300: "#678307",
      400: "#7A9C04",
      500: "#8DB600",
      600: "#9DC320",
      700: "#ADCF40",
      800: "#BCDA60",
      900: "#CBE480",
    },
  },
  components: {
    Container: containerTheme,
  },
});

export default theme;
