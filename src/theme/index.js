import { extendTheme } from "@chakra-ui/react";
import { containerTheme } from "./container";

const theme = extendTheme({
  components: {
    Container: containerTheme,
  },
});

export default theme;
