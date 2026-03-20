import { RouteObject } from "react-router-dom";
import SigninView from ".";
import SigninConnectView from "./connect";
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
      { path: "connect", element: <SigninConnectView /> },
    ],
  },
] satisfies RouteObject[];
