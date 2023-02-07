import React from "react";
import { ChakraProvider, localStorageManager } from "@chakra-ui/react";
import theme from "../theme";

export const Providers = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider theme={theme} colorModeManager={localStorageManager}>
    {children}
  </ChakraProvider>
);
