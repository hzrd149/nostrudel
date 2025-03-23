import { RouteObject } from "react-router-dom";
import PictureFeedView from ".";
import PicturePostView from "./post";

export default [
  { index: true, Component: PictureFeedView },
  { path: ":pointer", Component: PicturePostView },
] satisfies RouteObject[];
