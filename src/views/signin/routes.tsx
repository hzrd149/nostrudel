import { RouteObject } from "react-router-dom";
import SigninView from ".";
import SigninStartView from "./start";
import SigninNpubView from "./npub";
import SigninPrivateKeyView from "./nsec";
import SigninNostrAddressView from "./address";
import SigninNostrAddressCreate from "./address/create";
import SigninConnectView from "./connect";
import SigninNostrConnectSignerView from "./connect/signer";

export default [
  {
    element: <SigninView />,
    children: [
      { path: "", element: <SigninStartView /> },
      { path: "npub", element: <SigninNpubView /> },
      { path: "nsec", element: <SigninPrivateKeyView /> },
      {
        path: "address",
        children: [
          { path: "", element: <SigninNostrAddressView /> },
          { path: "create", element: <SigninNostrAddressCreate /> },
        ],
      },
      { path: "connect", element: <SigninConnectView /> },
      { path: "connect/signer", element: <SigninNostrConnectSignerView /> },
    ],
  },
] satisfies RouteObject[];
