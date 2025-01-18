import { RouteObject } from "react-router";
import BookmarksView from ".";

export default [
  { index: true, element: <BookmarksView /> },
  { path: ":pubkey", element: <BookmarksView /> },
] satisfies RouteObject[];
