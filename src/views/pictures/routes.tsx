import { RouteObject } from "react-router-dom";
import PictureFeedView from ".";
import PicturePostView from "./picture";

export default [
  { index: true, Component: PictureFeedView },
  { path: ":pointer", Component: PicturePostView },
] satisfies RouteObject[];
