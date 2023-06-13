import React, { useMemo } from "react";
import { ChakraProvider, localStorageManager } from "@chakra-ui/react";
import { SigningProvider } from "./signing-provider";
import createTheme from "../theme";
import useAppSettings from "../hooks/use-app-settings";
import DeleteEventProvider from "./delete-event-provider";
import { ErrorBoundary } from "../components/error-boundary";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const { primaryColor } = useAppSettings();
  const theme = useMemo(() => createTheme(primaryColor), [primaryColor]);

  return (
    <ChakraProvider theme={theme} colorModeManager={localStorageManager}>
      <SigningProvider>
        <ErrorBoundary>
          <DeleteEventProvider>{children}</DeleteEventProvider>
        </ErrorBoundary>
      </SigningProvider>
    </ChakraProvider>
  );
};
