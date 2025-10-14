import { RouteObject } from "react-router-dom";
import SigninView from ".";
import SigninNostrAddressView from "./address";
import SigninConnectView from "./connect";
import SigninNostrConnectSignerView from "./connect/signer";
import SigninNpubView from "./npub";
import SigninPrivateKeyView from "./nsec";
import SigninStartView from "./start";

export default [
  {
    element: <SigninView />,
    children: [
      { path: "", element: <SigninStartView /> },
      { path: "npub", element: <SigninNpubView /> },
      { path: "nsec", element: <SigninPrivateKeyView /> },
      { path: "address", element: <SigninNostrAddressView /> },
      { path: "connect", element: <SigninConnectView /> },
      { path: "connect/signer", element: <SigninNostrConnectSignerView /> },
    ],
  },
] satisfies RouteObject[];
