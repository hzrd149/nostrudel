import React, { PropsWithChildren, useMemo } from "react";
import { ChakraProvider, localStorageManager } from "@chakra-ui/react";

import { SigningProvider } from "./signing-provider";
import buildTheme from "../../theme";
import useAppSettings from "../../hooks/use-app-settings";
import NotificationTimelineProvider from "./notification-timeline";
import { DefaultEmojiProvider, UserEmojiProvider } from "./emoji-provider";
import { AllUserSearchDirectoryProvider } from "./user-directory-provider";
import BreakpointProvider from "./breakpoint-provider";
import DecryptionProvider from "./dycryption-provider";

// Top level providers, should be render as close to the root as possible
export const GlobalProviders = ({ children }: { children: React.ReactNode }) => {
  const { theme: themeName, primaryColor, maxPageWidth } = useAppSettings();
  const theme = useMemo(
    () => buildTheme(themeName, primaryColor, maxPageWidth !== "none" ? maxPageWidth : undefined),
    [themeName, primaryColor, maxPageWidth],
  );

  return (
    <ChakraProvider theme={theme} colorModeManager={localStorageManager}>
      <BreakpointProvider>
        <SigningProvider>
          <DecryptionProvider>
            <NotificationTimelineProvider>
              <DefaultEmojiProvider>
                <UserEmojiProvider>
                  <AllUserSearchDirectoryProvider>{children}</AllUserSearchDirectoryProvider>
                </UserEmojiProvider>
              </DefaultEmojiProvider>
            </NotificationTimelineProvider>
          </DecryptionProvider>
        </SigningProvider>
      </BreakpointProvider>
    </ChakraProvider>
  );
};
