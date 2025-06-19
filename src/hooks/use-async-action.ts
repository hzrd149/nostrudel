import { useToast } from "@chakra-ui/react";
import { DependencyList, useCallback, useRef, useState } from "react";

export default function useAsyncAction<Args extends Array<any>, T = any>(
  fn: (...args: Args) => Promise<T>,
  deps: DependencyList = [],
): { loading: boolean; run: (...args: Args) => Promise<T | undefined> } {
  const ref = useRef(fn);
  ref.current = fn;

  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const run = useCallback<(...args: Args) => Promise<T | undefined>>(async (...args: Args) => {
    setLoading(true);
    try {
      const result = await ref.current(...args);
      setLoading(false);
      return result;
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
      console.log(e);
    }
    setLoading(false);
  }, deps);

  return { loading, run };
}
