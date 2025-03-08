import { useObservable } from "applesauce-react/hooks";
import { controlApi$ } from "../services/bakery";

export default function useBakeryControl() {
  return useObservable(controlApi$);
}
