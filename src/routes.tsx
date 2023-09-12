import { RouteObject } from "react-router-dom";

import NoteView from "./views/note";

export const threadRoute: RouteObject = {
  path: "/n/:id",
  element: <NoteView />,
};
