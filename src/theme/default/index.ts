import chroma from "chroma-js";
import { DeepPartial, Theme, extendTheme } from "@chakra-ui/react";

import { cardTheme } from "./components/card";
import { pallet } from "../helpers";
import { buttonTheme } from "./components/button";
import { drawerTheme } from "./components/drawer";
import { modalTheme } from "./components/modal";
import { menuTheme } from "./components/menu";

const defaultTheme = extendTheme({
  colors: {
    gray: pallet(chroma.scale(["#d5d5d5", "#0e0e0e"]).colors(10)),
  },
  components: {
    Card: cardTheme,
    Button: buttonTheme,
    Drawer: drawerTheme,
    Modal: modalTheme,
    Menu: menuTheme,
  },
  semanticTokens: {
    colors: {
      "chakra-body-text": { _light: "gray.800", _dark: "white" },
      "chakra-body-bg": { _light: "white", _dark: "gray.900" },
      "chakra-subtle-bg": { _light: "gray.100", _dark: "gray.800" },
      "chakra-subtle-text": { _light: "gray.600", _dark: "gray.400" },
    },
  },
} as DeepPartial<Theme>);

export default defaultTheme;
