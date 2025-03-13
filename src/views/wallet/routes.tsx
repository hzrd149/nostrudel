import { RouteObject } from "react-router-dom";
import RequireActiveAccount from "../../components/router/require-active-account";
import { lazy } from "react";

const WalletHomeView = lazy(() => import("."));
const WalletReceiveView = lazy(() => import("./receive"));
const WalletSendView = lazy(() => import("./send/index"));
const WalletSendCashuView = lazy(() => import("./send/cashu"));
const WalletSendTokenView = lazy(() => import("./send/token"));

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
  {
    path: "send",
    children: [
      { index: true, Component: WalletSendView },
      { path: "cashu", Component: WalletSendCashuView },
      { path: "token", Component: WalletSendTokenView },
    ],
  },
] satisfies RouteObject[];
