import { ChakraProvider, localStorageManager } from "@chakra-ui/react";
import { AccountsProvider, ActionsProvider, EventStoreProvider, FactoryProvider } from "applesauce-react/providers";
import React, { useMemo } from "react";

import useAppSettings from "../../hooks/use-user-app-settings";
import accounts from "../../services/accounts";
import actions from "../../services/actions";
import factory from "../../services/event-factory";
import { eventStore } from "../../services/event-store";
import buildTheme from "../../theme";
import BreakpointProvider from "./breakpoint-provider";
import { UserEmojiProvider } from "./emoji-provider";
import PublishProvider from "./publish-provider";
import { SigningProvider } from "./signing-provider";

function ThemeProviders({ children }: { children: React.ReactNode }) {
  const { theme: themeName, primaryColor } = useAppSettings();
  const theme = useMemo(() => buildTheme(themeName, primaryColor), [themeName, primaryColor]);

  return (
    <ChakraProvider theme={theme} colorModeManager={localStorageManager}>
      <BreakpointProvider>{children}</BreakpointProvider>
    </ChakraProvider>
  );
}

// Top level providers, should be render as close to the root as possible
export const GlobalProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <EventStoreProvider eventStore={eventStore}>
      <AccountsProvider manager={accounts}>
        <ActionsProvider actionHub={actions}>
          <FactoryProvider factory={factory}>
            <ThemeProviders>
              <SigningProvider>
                <PublishProvider>
                  <UserEmojiProvider>{children}</UserEmojiProvider>
                </PublishProvider>
              </SigningProvider>
            </ThemeProviders>
          </FactoryProvider>
        </ActionsProvider>
      </AccountsProvider>
    </EventStoreProvider>
  );
};
