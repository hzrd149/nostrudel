import { useCallback, useMemo } from "react";
import { useObservable } from "applesauce-react/hooks";

import readStatusService from "../services/read-status";

export default function useReadStatus(key: string, ttl?: number) {
  const subject = useMemo(() => readStatusService.getStatus(key, ttl), [key]);

  const setRead = useCallback((read = true) => readStatusService.setRead(key, read, ttl), [key, ttl]);

  const read = useObservable(subject);

  return [read, setRead] as const;
}
