import React, { useEffect } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { HashRouter, Route, Routes } from "react-router-dom";
import { connectToRelays } from "./services/relays";
import { HomeView } from "./views/home";
import { UserView } from "./views/user";
import { ErrorBoundary } from "./components/error-boundary";
import { SettingsView } from "./views/settings";
import { WaitForRelays } from "./components/wait-for-relays";

export const App = () => {
  useEffect(() => {
    connectToRelays();
  }, []);

  return (
    <React.StrictMode>
      <ChakraProvider>
        <ErrorBoundary>
          <HashRouter>
            <Routes>
              <Route
                path="/user/:pubkey"
                element={
                  <WaitForRelays min={1}>
                    <UserView />
                  </WaitForRelays>
                }
              />
              <Route path="/settings" element={<SettingsView />} />
              <Route path="/" element={<HomeView />} />
            </Routes>
          </HashRouter>
        </ErrorBoundary>
      </ChakraProvider>
    </React.StrictMode>
  );
};
