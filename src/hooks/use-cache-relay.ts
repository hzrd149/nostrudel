import { useObservable } from "applesauce-react/hooks";
import { cacheRelay$ } from "../services/cache-relay";

export default function useCacheRelay() {
  return useObservable(cacheRelay$);
}
