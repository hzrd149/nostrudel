import React, { useMemo } from "react";
import { ChakraProvider, localStorageManager } from "@chakra-ui/react";
import { AccountsProvider, QueryStoreProvider } from "applesauce-react/providers";

import { SigningProvider } from "./signing-provider";
import buildTheme from "../../theme";
import useAppSettings from "../../hooks/use-user-app-settings";
import NotificationsProvider from "./notifications-provider";
import { UserEmojiProvider } from "./emoji-provider";
import BreakpointProvider from "./breakpoint-provider";
import PublishProvider from "./publish-provider";
import WebOfTrustProvider from "./web-of-trust-provider";
import { queryStore } from "../../services/event-store";
import EventFactoryProvider from "./event-factory-provider";
import accounts from "../../services/accounts";

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
    <QueryStoreProvider queryStore={queryStore}>
      <AccountsProvider manager={accounts}>
        <ThemeProviders>
          <SigningProvider>
            <PublishProvider>
              <NotificationsProvider>
                <UserEmojiProvider>
                  <EventFactoryProvider>
                    <WebOfTrustProvider>{children}</WebOfTrustProvider>
                  </EventFactoryProvider>
                </UserEmojiProvider>
              </NotificationsProvider>
            </PublishProvider>
          </SigningProvider>
        </ThemeProviders>
      </AccountsProvider>
    </QueryStoreProvider>
  );
};
