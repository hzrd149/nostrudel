import { RouteObject } from "react-router-dom";

import ListsHomeView from ".";
import ListView from "./list";
import FollowingListsView from "./following";
import MutedListsView from "./muted";

export default [
  { index: true, element: <ListsHomeView /> },
  { path: "following", element: <FollowingListsView /> },
  { path: "muted", element: <MutedListsView /> },
  { path: ":addr", element: <ListView /> },
] satisfies RouteObject[];
