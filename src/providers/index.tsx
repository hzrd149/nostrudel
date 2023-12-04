import React, { useMemo } from "react";
import { ChakraProvider, localStorageManager } from "@chakra-ui/react";

import { SigningProvider } from "./signing-provider";
import buildTheme from "../theme";
import useAppSettings from "../hooks/use-app-settings";
import DeleteEventProvider from "./delete-event-provider";
import { InvoiceModalProvider } from "./invoice-modal";
import NotificationTimelineProvider from "./notification-timeline";
import PostModalProvider from "./post-modal-provider";
import { DefaultEmojiProvider, UserEmojiProvider } from "./emoji-provider";
import { AllUserSearchDirectoryProvider } from "./user-directory-provider";
import MuteModalProvider from "./mute-modal-provider";
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
      {children}
    </ChakraProvider>
  );
};

/** Providers that provider functionality to pages (needs to be rendered under a router) */
export function PageProviders({ children }: { children: React.ReactNode }) {
  return (
    <BreakpointProvider>
      <SigningProvider>
        <DecryptionProvider>
          <DeleteEventProvider>
            <MuteModalProvider>
              <InvoiceModalProvider>
                <NotificationTimelineProvider>
                  <DefaultEmojiProvider>
                    <UserEmojiProvider>
                      <AllUserSearchDirectoryProvider>
                        <PostModalProvider>{children}</PostModalProvider>
                      </AllUserSearchDirectoryProvider>
                    </UserEmojiProvider>
                  </DefaultEmojiProvider>
                </NotificationTimelineProvider>
              </InvoiceModalProvider>
            </MuteModalProvider>
          </DeleteEventProvider>
        </DecryptionProvider>
      </SigningProvider>
    </BreakpointProvider>
  );
}
