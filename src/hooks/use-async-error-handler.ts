import { useToast } from "@chakra-ui/react";
import { DependencyList, useCallback } from "react";

export default function useAsyncErrorHandler<T = any>(
  fn: () => Promise<T>,
  deps: DependencyList,
): () => Promise<T | undefined> {
  const toast = useToast();

  return useCallback(async () => {
    try {
      return await fn();
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  }, deps);
}
