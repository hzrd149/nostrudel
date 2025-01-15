import { Suspense } from "react";
import { Flex, Spinner } from "@chakra-ui/react";
import { Outlet, ScrollRestoration } from "react-router-dom";

import DesktopSideNav from "./side-nav";
import { ErrorBoundary } from "../../error-boundary";

export default function DesktopLayout() {
  return (
    <>
      <ScrollRestoration />
      <DesktopSideNav />
      <Suspense fallback={<Spinner />}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </Suspense>
    </>
  );
}
