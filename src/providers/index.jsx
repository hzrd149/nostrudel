import React from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { RelaysProvider } from "./relay-provider";
import { HashRouter } from "react-router-dom";
import theme from "../theme";

export const Providers = ({ children }) => (
  <ChakraProvider theme={theme}>
    <HashRouter>
      <RelaysProvider>{children}</RelaysProvider>
    </HashRouter>
  </ChakraProvider>
);
