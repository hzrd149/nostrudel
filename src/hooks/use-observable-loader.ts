import { TimelineLoader } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { map, Observable } from "rxjs";

/** Reads a TimelineLoader from an observable without React treating the function as a state updater */
export default function useObservableLoader(loader$: Observable<TimelineLoader | null>): TimelineLoader | undefined {
  const wrapped = use$(() => loader$.pipe(map((loader) => (loader ? { loader } : null))), [loader$]);
  return wrapped?.loader ?? undefined;
}
