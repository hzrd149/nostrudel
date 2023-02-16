import React from "react";
import { ChakraProvider, localStorageManager } from "@chakra-ui/react";
import theme from "../theme";
import { SigningProvider } from "./signing-provider";

export const Providers = ({ children }: { children: React.ReactNode }) => (
  <ChakraProvider theme={theme} colorModeManager={localStorageManager}>
    <SigningProvider>{children}</SigningProvider>
  </ChakraProvider>
);
