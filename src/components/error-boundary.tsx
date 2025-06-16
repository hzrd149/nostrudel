import React, { memo } from "react";
import { ErrorBoundary as ErrorBoundaryHelper, FallbackProps } from "react-error-boundary";
import { Alert, AlertIcon, AlertTitle, AlertDescription } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import DebugEventButton from "./debug-modal/debug-event-button";

export function ErrorFallback({ error, event }: Partial<FallbackProps> & { event?: NostrEvent }) {
  return (
    <Alert status="error">
      <AlertIcon />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>{error?.message}</AlertDescription>
      {event && <DebugEventButton event={event} size="sm" variant="ghost" ml="auto" />}
    </Alert>
  );
}

export const ErrorBoundary = memo(
  ({ children, event, ...props }: { children: React.ReactNode; event?: NostrEvent }) => (
    <ErrorBoundaryHelper fallbackRender={({ error }) => <ErrorFallback error={error} event={event} />} {...props}>
      {children}
    </ErrorBoundaryHelper>
  ),
);
