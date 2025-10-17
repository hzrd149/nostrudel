import { Outlet, RouteObject } from "react-router-dom";
import RequireActiveAccount from "../../../components/router/require-active-account";
import BlindspotHomeView from ".";
import BlindspotFeedView from "./feed";

export default [
  {
    element: (
      <RequireActiveAccount>
        <Outlet />
      </RequireActiveAccount>
    ),
    children: [
      { index: true, Component: BlindspotHomeView },
      { path: ":pubkey", Component: BlindspotFeedView },
    ],
  },
] satisfies RouteObject[];
