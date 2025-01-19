import { RouteObject } from "react-router-dom";
import BookmarksView from ".";

export default [
  { index: true, element: <BookmarksView /> },
  { path: ":pubkey", element: <BookmarksView /> },
] satisfies RouteObject[];
