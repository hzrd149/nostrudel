import { useMemo } from "react";
import listsService from "../services/lists";
import useSubject from "./use-subject";

export default function useUserLists(pubkey: string, relays: string[], alwaysFetch?: boolean) {
  const subject = useMemo(() => {
    if (relays.length === 0) return;
    return listsService.requestUserLists(pubkey, relays, alwaysFetch);
  }, [pubkey, relays.join("|"), alwaysFetch]);

  return useSubject(subject) || {};
}
