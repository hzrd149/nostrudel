import { useMemo } from "react";
import { useObservable } from "react-use";
import userMetadata from "../services/user-metadata";

export function useUserMetadata(pubkey: string) {
  const observable = useMemo(
    () => userMetadata.requestUserMetadata(pubkey),
    [pubkey]
  );
  return useObservable(observable);
}
