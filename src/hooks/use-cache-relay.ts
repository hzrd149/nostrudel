import { useObservableEagerState } from "applesauce-react/hooks";
import { cacheRelay$ } from "../services/cache-relay";

export default function useCacheRelay() {
  return useObservableEagerState(cacheRelay$);
}
