import React, { useMemo } from "react";
import { ChakraProvider, localStorageManager } from "@chakra-ui/react";
import { AccountsProvider, QueryStoreProvider, ActionsProvider, FactoryProvider } from "applesauce-react/providers";

import { SigningProvider } from "./signing-provider";
import buildTheme from "../../theme";
import useAppSettings from "../../hooks/use-user-app-settings";
import { UserEmojiProvider } from "./emoji-provider";
import BreakpointProvider from "./breakpoint-provider";
import PublishProvider from "./publish-provider";
import WebOfTrustProvider from "./web-of-trust-provider";
import { queryStore } from "../../services/event-store";
import accounts from "../../services/accounts";
import actions from "../../services/actions";
import factory from "../../services/event-factory";

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
        <ActionsProvider actionHub={actions}>
          <FactoryProvider factory={factory}>
            <ThemeProviders>
              <SigningProvider>
                <PublishProvider>
                  <UserEmojiProvider>
                    <WebOfTrustProvider>{children}</WebOfTrustProvider>
                  </UserEmojiProvider>
                </PublishProvider>
              </SigningProvider>
            </ThemeProviders>
          </FactoryProvider>
        </ActionsProvider>
      </AccountsProvider>
    </QueryStoreProvider>
  );
};
