import { lazy } from "react";
import { RouteObject } from "react-router";

const LoginView = lazy(() => import("."));
const LoginStartView = lazy(() => import("./start"));
const LoginNpubView = lazy(() => import("./npub"));
const LoginNsecView = lazy(() => import("./nsec"));
const LoginNostrAddressView = lazy(() => import("./address"));
const LoginNostrAddressCreate = lazy(() => import("./address/create"));
const LoginNostrConnectView = lazy(() => import("./nostr-connect"));

export default [
  {
    element: <LoginView />,
    children: [
      { path: "", element: <LoginStartView /> },
      { path: "npub", element: <LoginNpubView /> },
      { path: "nsec", element: <LoginNsecView /> },
      {
        path: "address",
        children: [
          { path: "", element: <LoginNostrAddressView /> },
          { path: "create", element: <LoginNostrAddressCreate /> },
        ],
      },
      { path: "nostr-connect", element: <LoginNostrConnectView /> },
    ],
  },
] satisfies RouteObject[];
