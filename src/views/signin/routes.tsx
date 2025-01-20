import { RouteObject } from "react-router-dom";
import LoginView from ".";
import LoginStartView from "./start";
import LoginNpubView from "./npub";
import LoginNsecView from "./nsec";
import LoginNostrAddressView from "./address";
import LoginNostrAddressCreate from "./address/create";
import LoginNostrConnectView from "./nostr-connect";

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
