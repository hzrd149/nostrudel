import { useMemo } from "react";
import { QueryConstructor } from "applesauce-core";

import { queryStore } from "../services/event-store";
import { useObservable } from "./use-observable";

export function useStoreQuery<T extends unknown, Args extends Array<any>>(
  queryConstructor: QueryConstructor<T, Args>,
  args?: Args | null,
) {
  const observable = useMemo(() => {
    if (args) return queryStore.runQuery(queryConstructor)(...args);
  }, [args]);

  return useObservable(observable);
}
