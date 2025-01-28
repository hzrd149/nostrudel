import { RouteObject } from "react-router-dom";
import RequireActiveAccount from "../../components/router/require-active-account";
import { lazy } from "react";

const WalletHomeView = lazy(() => import("."));

export default [
  {
    index: true,
    element: (
      <RequireActiveAccount>
        <WalletHomeView />
      </RequireActiveAccount>
    ),
  },
] satisfies RouteObject[];
