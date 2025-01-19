import { Outlet } from "react-router-dom";

import MobileBottomNav from "./bottom-nav";
import { ErrorBoundary } from "../../error-boundary";

export default function MobileLayout() {
  return (
    <>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      <MobileBottomNav />
    </>
  );
}
