import { useState } from "react";
import { isStateful } from "applesauce-core/observable";
import { useIsomorphicLayoutEffect } from "react-use";
import Observable from "zen-observable";
import { useForceUpdate } from "@chakra-ui/react";

export function useObservable<T>(observable?: Observable<T>): T | undefined {
  const forceUpdate = useForceUpdate();
  const [value, update] = useState<T | undefined>(observable && isStateful(observable) ? observable.value : undefined);

  useIsomorphicLayoutEffect(() => {
    if (!observable) return;

    const s = observable.subscribe((v) => {
      update(v);
      forceUpdate();
    });
    return () => s.unsubscribe();
  }, [observable]);

  return value;
}
