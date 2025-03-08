import { Suspense } from "react";
import { Spinner } from "@chakra-ui/react";
import { Outlet } from "react-router-dom";

import DesktopSideNav from "./side-nav";
import { ErrorBoundary } from "../../error-boundary";
import SupportPaywall from "../components/support-paywall";

export default function DesktopLayout() {
  return (
    <>
      <SupportPaywall />
      <DesktopSideNav />
      <ErrorBoundary>
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
