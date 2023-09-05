import React, { useMemo } from "react";
import { ChakraProvider, localStorageManager } from "@chakra-ui/react";
import { SigningProvider } from "./signing-provider";
import createTheme from "../theme";
import useAppSettings from "../hooks/use-app-settings";
import DeleteEventProvider from "./delete-event-provider";
import { InvoiceModalProvider } from "./invoice-modal";
import NotificationTimelineProvider from "./notification-timeline";
import PostModalProvider from "./post-modal-provider";
import { DefaultEmojiProvider, UserEmojiProvider } from "./emoji-provider";
import { UserContactsUserDirectoryProvider } from "./user-directory-provider";

// Top level providers, should be render as close to the root as possible
export const GlobalProviders = ({ children }: { children: React.ReactNode }) => {
  const { primaryColor } = useAppSettings();
  const theme = useMemo(() => createTheme(primaryColor), [primaryColor]);

  return (
    <ChakraProvider theme={theme} colorModeManager={localStorageManager}>
      {children}
    </ChakraProvider>
  );
};

/** Providers that provider functionality to pages (needs to be rendered under a router) */
export function PageProviders({ children }: { children: React.ReactNode }) {
  return (
    <SigningProvider>
      <DeleteEventProvider>
        <InvoiceModalProvider>
          <NotificationTimelineProvider>
            <DefaultEmojiProvider>
              <UserEmojiProvider>
                <UserContactsUserDirectoryProvider>
                  <PostModalProvider>{children}</PostModalProvider>
                </UserContactsUserDirectoryProvider>
              </UserEmojiProvider>
            </DefaultEmojiProvider>
          </NotificationTimelineProvider>
        </InvoiceModalProvider>
      </DeleteEventProvider>
    </SigningProvider>
  );
}
