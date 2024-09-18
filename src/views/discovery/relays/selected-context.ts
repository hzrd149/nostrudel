import { createContext } from "react";
import useRouteStateValue from "../../../hooks/use-route-state-value";

export const SelectedContext = createContext<ReturnType<typeof useRouteStateValue<string>>>({
  value: "",
  setValue() {},
  clearValue() {},
});
