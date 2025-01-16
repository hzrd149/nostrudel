import { RouteObject } from "react-router";

import SignupView from ".";

export default [
  {
    index: true,
    element: <SignupView />,
  },
  {
    path: ":step",
    element: <SignupView />,
  },
] satisfies RouteObject[];
