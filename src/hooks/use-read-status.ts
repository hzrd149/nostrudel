import { useCallback, useMemo } from "react";
import readStatusService from "../services/read-status";
import useSubject from "./use-subject";

export default function useReadStatus(key: string, ttl?: number) {
  const subject = useMemo(() => readStatusService.getStatus(key, ttl), [key]);

  const setRead = useCallback((read = true) => readStatusService.setRead(key, read, ttl), [key, ttl]);

  const read = useSubject(subject);

  return [read, setRead] as const;
}
