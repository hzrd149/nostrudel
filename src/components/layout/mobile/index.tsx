import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Spinner } from "@chakra-ui/react";

import MobileBottomNav from "./bottom-nav";
import { ErrorBoundary } from "../../error-boundary";
import SupportPaywall from "../components/support-paywall";

export default function MobileLayout() {
  return (
    <>
      <SupportPaywall />
      <Suspense fallback={<Spinner />}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </Suspense>
      <MobileBottomNav />
    </>
  );
}
