import { RouteObject } from "react-router-dom";

import ThreadView from "./views/note";

export const threadRoute: RouteObject = {
  path: "/n/:id",
  element: <ThreadView />,
};
