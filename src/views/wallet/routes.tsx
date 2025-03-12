import { RouteObject } from "react-router-dom";
import RequireActiveAccount from "../../components/router/require-active-account";
import { lazy } from "react";

const WalletHomeView = lazy(() => import("."));
const WalletReceiveView = lazy(() => import("./receive"));

export default [
  {
    index: true,
    element: (
      <RequireActiveAccount>
        <WalletHomeView />
      </RequireActiveAccount>
    ),
  },
  { path: "receive", Component: WalletReceiveView },
] satisfies RouteObject[];
