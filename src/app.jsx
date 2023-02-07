import React from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { HomeView } from "./views/home";
import { UserView } from "./views/user";
import { ErrorBoundary } from "./components/error-boundary";
import { SettingsView } from "./views/settings";

export const App = () => {
  return (
    <ChakraProvider>
      <ErrorBoundary>
        <HashRouter>
          <Routes>
            <Route path="/user/:pubkey" element={<UserView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/" element={<HomeView />} />
          </Routes>
        </HashRouter>
      </ErrorBoundary>
    </ChakraProvider>
  );
};
