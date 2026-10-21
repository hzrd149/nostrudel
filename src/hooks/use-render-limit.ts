import { useCallback, useState } from "react";

/** Caps how many items of a long list are rendered, growing by `step` each time `more` is called */
export default function useRenderLimit<T>(items: T[] | undefined, step = 50) {
  const [limit, setLimit] = useState(step);
  const more = useCallback(() => setLimit((l) => l + step), [step]);

  return { visible: items?.slice(0, limit), hasMore: (items?.length ?? 0) > limit, more };
}
