import { useCallback, useMemo, useState } from "react";

type Options = {
  pageSize?: number;
};

export function usePaginatedList<T extends unknown>(list: T[], opts?: Options) {
  const [currentPage, setPage] = useState(0);
  const pageSize = opts?.pageSize ?? 20;
  const pageCount = Math.ceil(list.length / pageSize);
  const next = useCallback(() => setPage((v) => Math.min(v + 1, pageCount - 1)), [setPage, pageCount]);
  const previous = useCallback(() => setPage((v) => Math.max(v - 1, 0)), [setPage]);
  const pageItems = useMemo(
    () => list.slice(pageSize * currentPage, pageSize * currentPage + pageSize),
    [list, currentPage, pageSize]
  );

  return {
    currentPage,
    setPage,
    pageItems,
    pageCount,
    previous,
    next,
  };
}
