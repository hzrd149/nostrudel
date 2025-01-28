import { Outlet, RouteObject } from "react-router-dom";
import RequireActiveAccount from "../../components/router/require-active-account";

import NewView from ".";
import NewNoteView from "./note";
import NewMediaPostView from "./media";

export default [
  {
    element: (
      <RequireActiveAccount>
        <Outlet />
      </RequireActiveAccount>
    ),
    children: [
      { index: true, element: <NewView /> },
      { path: "note", element: <NewNoteView /> },
      { path: "media", element: <NewMediaPostView /> },
    ],
  },
] satisfies RouteObject[];
