import { RouteObject } from "react-router";

import ListsHomeView from ".";
import BrowseListView from "./browse";
import ListView from "./list";

export default [
  { index: true, element: <ListsHomeView /> },
  { path: "browse", element: <BrowseListView /> },
  { path: ":addr", element: <ListView /> },
] satisfies RouteObject[];
