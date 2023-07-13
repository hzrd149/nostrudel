import React, { useMemo } from "react";
import { ChakraProvider, localStorageManager } from "@chakra-ui/react";
import { SigningProvider } from "./signing-provider";
import createTheme from "../theme";
import useAppSettings from "../hooks/use-app-settings";
import { InvoiceModalProvider } from "./invoice-modal";
import NotificationTimelineProvider from "./notification-timeline";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const { primaryColor } = useAppSettings();
  const theme = useMemo(() => createTheme(primaryColor), [primaryColor]);

  return (
    <ChakraProvider theme={theme} colorModeManager={localStorageManager}>
      <SigningProvider>
        <InvoiceModalProvider>
          <NotificationTimelineProvider>{children}</NotificationTimelineProvider>
        </InvoiceModalProvider>
      </SigningProvider>
    </ChakraProvider>
  );
};
