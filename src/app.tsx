import React from "react";
import { Spinner } from "@chakra-ui/react";
import { Route, Routes } from "react-router-dom";
import { HomeView } from "./views/home";
import { UserView } from "./views/user";
import { ErrorBoundary } from "./components/error-boundary";
import { SettingsView } from "./views/settings";
import { GlobalView } from "./views/global";
import { useRelays } from "./providers/relay-provider";
import { Page } from "./components/page";

export const App = () => {
  const { loading } = useRelays();

  if (loading) return <Spinner size="xl" />;

  return (
    <ErrorBoundary>
      <Routes>
        <Route
          path="/user/:pubkey"
          element={
            <Page>
              <UserView />
            </Page>
          }
        />
        <Route
          path="/settings"
          element={
            <Page>
              <SettingsView />
            </Page>
          }
        />
        <Route
          path="/global"
          element={
            <Page>
              <GlobalView />
            </Page>
          }
        />
        <Route
          path="/"
          element={
            <Page>
              <HomeView />
            </Page>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
};
