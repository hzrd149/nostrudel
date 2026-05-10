import { Outlet, RouteObject } from "react-router-dom";
import RequireActiveAccount from "../../components/router/require-active-account";

import NewView from ".";
import NewNoteView from "./note";
import NewPictureView from "./picture/index";
import NewPollView from "./poll";

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
      { path: "media", element: <NewPictureView /> },
      { path: "poll", element: <NewPollView /> },
    ],
  },
] satisfies RouteObject[];