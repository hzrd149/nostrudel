import { extendTheme } from "@chakra-ui/react";
import { containerTheme } from "./container";

const theme = extendTheme({
  colors: {
    // https://hihayk.github.io/scale/#5/4/60/50/0/0/20/-25/8DB600/141/182/0/white
    // brand: {
    //   50: "#334009",
    //   100: "#44550A",
    //   200: "#556C09",
    //   300: "#678307",
    //   400: "#7A9C04",
    //   500: "#8DB600",
    //   600: "#9DC320",
    //   700: "#ADCF40",
    //   800: "#BCDA60",
    //   900: "#CBE480",
    // },
    brand: {
      50: "#8DB600",
      100: "#8DB600",
      200: "#8DB600",
      300: "#8DB600",
      400: "#8DB600",
      500: "#8DB600",
      600: "#8DB600",
      700: "#8DB600",
      800: "#8DB600",
      900: "#8DB600",
    },
  },
  components: {
    Container: containerTheme,
  },
});

export default theme;
