import { RouteObject } from "react-router-dom";
import ArticlesHomeView from ".";
import ArticleView from "./article";

export default [
  { index: true, Component: ArticlesHomeView },
  { path: ":naddr", Component: ArticleView },
] satisfies RouteObject[];
