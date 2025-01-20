import { RouteObject } from "react-router-dom";
import RequireCurrentAccount from "../../components/router/require-current-account";
import { lazy } from "react";

const WalletHomeView = lazy(() => import("."));

export default [
  {
    index: true,
    element: (
      <RequireCurrentAccount>
        <WalletHomeView />
      </RequireCurrentAccount>
    ),
  },
] satisfies RouteObject[];
