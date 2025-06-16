import { useObservableEagerMemo } from "applesauce-react/hooks";
import { useCallback } from "react";

import readStatusService from "../services/read-status";

export default function useReadStatus(key: string, ttl?: number) {
  const read = useObservableEagerMemo(() => readStatusService.getStatus(key, ttl), [key]);
  const setRead = useCallback((read = true) => readStatusService.setRead(key, read, ttl), [key, ttl]);

  return [read, setRead] as const;
}
