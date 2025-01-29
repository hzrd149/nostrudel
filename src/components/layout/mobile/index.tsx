import { Outlet } from "react-router-dom";

import MobileBottomNav from "./bottom-nav";
import { ErrorBoundary } from "../../error-boundary";
import { Suspense } from "react";
import { Spinner } from "@chakra-ui/react";

export default function MobileLayout() {
  return (
    <>
      <Suspense fallback={<Spinner />}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </Suspense>
      <MobileBottomNav />
    </>
  );
}
