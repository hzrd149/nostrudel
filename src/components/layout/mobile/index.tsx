import { BehaviorSubject } from "rxjs";
import { Outlet, ScrollRestoration } from "react-router-dom";
import { useObservable } from "applesauce-react/hooks";

import ConnectionStatus from "../connection-status";
import MobileBottomNav from "./bottom-nav";
import { ErrorBoundary } from "../../error-boundary";

export const showMobileNav = new BehaviorSubject(true);

export default function MobileLayout() {
  const showNav = useObservable(showMobileNav);

  return (
    <>
      <ScrollRestoration />
      <ConnectionStatus />
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      {showNav && <MobileBottomNav />}
    </>
  );
}
