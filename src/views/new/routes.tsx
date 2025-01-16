import { Outlet, RouteObject } from "react-router";
import RequireCurrentAccount from "../../components/router/require-current-account";

import NewView from ".";
import NewNoteView from "./note";
import NewMediaPostView from "./media";

export default [
  {
    element: (
      <RequireCurrentAccount>
        <Outlet />
      </RequireCurrentAccount>
    ),
    children: [
      { index: true, element: <NewView /> },
      { path: "note", element: <NewNoteView /> },
      { path: "media", element: <NewMediaPostView /> },
    ],
  },
] satisfies RouteObject[];
