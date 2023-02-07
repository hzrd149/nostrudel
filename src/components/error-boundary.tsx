import React from "react";
import {
  ErrorBoundary as ErrorBoundaryHelper,
  FallbackProps,
} from "react-error-boundary";
import {
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Alert status="error">
      <AlertIcon />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  );
}

export const ErrorBoundary = ({
  children,
  ...props
}: {
  children: React.ReactNode;
}) => (
  <ErrorBoundaryHelper FallbackComponent={ErrorFallback} {...props}>
    {children}
  </ErrorBoundaryHelper>
);
