import React, { memo } from "react";
import { ErrorBoundary as ErrorBoundaryHelper, FallbackProps } from "react-error-boundary";
import { Alert, AlertIcon, AlertTitle, AlertDescription } from "@chakra-ui/react";

export function ErrorFallback({ error, resetErrorBoundary }: Partial<FallbackProps>) {
  return (
    <Alert status="error">
      <AlertIcon />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>{error?.message}</AlertDescription>
    </Alert>
  );
}

export const ErrorBoundary = memo(({ children, ...props }: { children: React.ReactNode }) => (
  <ErrorBoundaryHelper FallbackComponent={ErrorFallback} {...props}>
    {children}
  </ErrorBoundaryHelper>
));
