import React from "react";
import { ChakraProvider, localStorageManager } from "@chakra-ui/react";
import { BrowserRouter, HashRouter } from "react-router-dom";
import theme from "../theme";

export const Providers = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider theme={theme} colorModeManager={localStorageManager}>
    <HashRouter>{children}</HashRouter>
  </ChakraProvider>
);
