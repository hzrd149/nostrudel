'use client'
import {
  ToastProvider
} from "./chunk-3Y4YXCR2.mjs";
import {
  createToastFn
} from "./chunk-HYCJNCPE.mjs";

// src/create-standalone-toast.tsx
import {
  ColorModeContext,
  ThemeProvider
} from "@chakra-ui/system";
import { theme as defaultTheme } from "@chakra-ui/theme";
import { jsx } from "react/jsx-runtime";
var defaults = {
  duration: 5e3,
  variant: "solid"
};
var defaultStandaloneParam = {
  theme: defaultTheme,
  colorMode: "light",
  toggleColorMode: () => {
  },
  setColorMode: () => {
  },
  defaultOptions: defaults,
  forced: false
};
function createStandaloneToast({
  theme = defaultStandaloneParam.theme,
  colorMode = defaultStandaloneParam.colorMode,
  toggleColorMode = defaultStandaloneParam.toggleColorMode,
  setColorMode = defaultStandaloneParam.setColorMode,
  defaultOptions = defaultStandaloneParam.defaultOptions,
  motionVariants,
  toastSpacing,
  component,
  forced
} = defaultStandaloneParam) {
  const colorModeContextValue = {
    colorMode,
    setColorMode,
    toggleColorMode,
    forced
  };
  const ToastContainer = () => /* @__PURE__ */ jsx(ThemeProvider, { theme, children: /* @__PURE__ */ jsx(ColorModeContext.Provider, { value: colorModeContextValue, children: /* @__PURE__ */ jsx(
    ToastProvider,
    {
      defaultOptions,
      motionVariants,
      toastSpacing,
      component
    }
  ) }) });
  return {
    ToastContainer,
    toast: createToastFn(theme.direction, defaultOptions)
  };
}

export {
  defaultStandaloneParam,
  createStandaloneToast
};
//# sourceMappingURL=chunk-FOFDA6UD.mjs.map