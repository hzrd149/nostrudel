import { useObservable } from "applesauce-react/hooks";
import { bakery$ } from "../services/bakery";

export default function useBakery() {
  return useObservable(bakery$);
}
