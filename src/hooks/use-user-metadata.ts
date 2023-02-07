import { useMemo } from "react";
import userMetadata from "../services/user-metadata";
import useSubject from "./use-subject";

export function useUserMetadata(pubkey: string) {
  const observable = useMemo(
    () => userMetadata.requestUserMetadata(pubkey),
    [pubkey]
  );
  const metadata = useSubject(observable) ?? undefined;

  return {
    loading: !metadata,
    metadata,
  };
}
