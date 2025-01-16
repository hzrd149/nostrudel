import { lazy } from "react";
import { RouteObject } from "react-router";

const BookmarksView = lazy(() => import("."));

export default [
  { index: true, element: <BookmarksView /> },
  { path: ":pubkey", element: <BookmarksView /> },
] satisfies RouteObject[];
