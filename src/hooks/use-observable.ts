import { useState } from "react";
import { isStateful } from "applesauce-core/observable";
import { useIsomorphicLayoutEffect } from "react-use";
import Observable from "zen-observable";

export function useObservable<T>(observable?: Observable<T>): T | undefined {
  const [value, update] = useState<T | undefined>(observable && isStateful(observable) ? observable.value : undefined);

  useIsomorphicLayoutEffect(() => {
    if (!observable) return;

    const s = observable.subscribe(update);
    return () => s.unsubscribe();
  }, [observable]);

  return value;
}
