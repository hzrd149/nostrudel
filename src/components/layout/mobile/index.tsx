import { Outlet, ScrollRestoration } from "react-router-dom";

import MobileBottomNav from "./bottom-nav";
import { ErrorBoundary } from "../../error-boundary";

export default function MobileLayout() {
  return (
    <>
      <ScrollRestoration />
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      <MobileBottomNav />
    </>
  );
}
