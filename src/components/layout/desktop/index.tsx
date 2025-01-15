import { Suspense } from "react";
import { Spinner } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";

import DesktopSideNav from "./side-nav";
import { ErrorBoundary } from "../../error-boundary";

export default function DesktopLayout() {
  return (
    <>
      <DesktopSideNav />
      <Suspense fallback={<Spinner />}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </Suspense>
    </>
  );
}
