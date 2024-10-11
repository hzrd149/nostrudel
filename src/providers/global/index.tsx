import React, { useMemo } from "react";
import { ChakraProvider, localStorageManager } from "@chakra-ui/react";
import { QueryStoreProvider } from "applesauce-react";

import { SigningProvider } from "./signing-provider";
import buildTheme from "../../theme";
import useAppSettings from "../../hooks/use-app-settings";
import NotificationsProvider from "./notifications-provider";
import { DefaultEmojiProvider, UserEmojiProvider } from "./emoji-provider";
import { AllUserSearchDirectoryProvider } from "./user-directory-provider";
import BreakpointProvider from "./breakpoint-provider";
import DMTimelineProvider from "./dms-provider";
import PublishProvider from "./publish-provider";
import WebOfTrustProvider from "./web-of-trust-provider";
import { queryStore } from "../../services/event-store";

function ThemeProviders({ children }: { children: React.ReactNode }) {
  const { theme: themeName, primaryColor, maxPageWidth } = useAppSettings();
  const theme = useMemo(
    () => buildTheme(themeName, primaryColor, maxPageWidth !== "none" ? maxPageWidth : undefined),
    [themeName, primaryColor, maxPageWidth],
  );

  return (
    <ChakraProvider theme={theme} colorModeManager={localStorageManager}>
      <BreakpointProvider>{children}</BreakpointProvider>
    </ChakraProvider>
  );
}

// Top level providers, should be render as close to the root as possible
export const GlobalProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryStoreProvider store={queryStore}>
      <ThemeProviders>
        <SigningProvider>
          <PublishProvider>
            <NotificationsProvider>
              <DMTimelineProvider>
                <DefaultEmojiProvider>
                  <UserEmojiProvider>
                    <AllUserSearchDirectoryProvider>
                      <WebOfTrustProvider>{children}</WebOfTrustProvider>
                    </AllUserSearchDirectoryProvider>
                  </UserEmojiProvider>
                </DefaultEmojiProvider>
              </DMTimelineProvider>
            </NotificationsProvider>
          </PublishProvider>
        </SigningProvider>
      </ThemeProviders>
    </QueryStoreProvider>
  );
};
