import { extendTheme, Theme, DeepPartial } from "@chakra-ui/react";
import chroma from "chroma-js";

import defaultTheme from "./default";
import { drawerTheme } from "./drawer";
import { containerTheme } from "./container";

function pallet(colors: string[]) {
  return [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].reduce(
    (pallet, key, i) => ({ ...pallet, [key]: colors[i] }),
    {},
  );
}

function getTheme(name: string) {
  if (name === "default") return defaultTheme;
  return {};
}

const breakpoints = ["sm", "md", "lg", "xl", "2xl"] as const;

export default function buildTheme(
  themeName: string,
  primaryColor: string = "#8DB600",
  maxBreakpoint?: (typeof breakpoints)[number],
) {
  const theme = extendTheme(getTheme(themeName), {
    config: {
      initialColorMode: "system",
      useSystemColorMode: true,
    },
    colors: {
      primary: pallet(chroma.scale([chroma(primaryColor).brighten(1), chroma(primaryColor).darken(1)]).colors(10)),
    },
    components: {
      Container: containerTheme,
      Drawer: drawerTheme,
    },
    semanticTokens: {
      colors: {
        "card-hover-overlay": {
          _light: "blackAlpha.50",
          _dark: "whiteAlpha.50",
        },
      },
    },
  } as DeepPartial<Theme>);

  // if maxBreakpoint is set, set all breakpoints above it to a large number so they are never reached
  if (maxBreakpoint && breakpoints.includes(maxBreakpoint)) {
    for (let i = breakpoints.indexOf(maxBreakpoint) + 1; i < breakpoints.length; i++) {
      theme.breakpoints[breakpoints[i]] = 50000;
    }
  }

  return theme;
}
