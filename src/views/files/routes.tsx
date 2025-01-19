import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const FilesHomeView = lazy(() => import("."));
const FileDetailsView = lazy(() => import("./file"));

export default [
  {
    index: true,
    element: <FilesHomeView />,
  },
  {
    path: ":nevent",
    element: <FileDetailsView />,
  },
] satisfies RouteObject[];
