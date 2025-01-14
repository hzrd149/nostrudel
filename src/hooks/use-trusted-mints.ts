import { useStoreQuery } from "applesauce-react/hooks";
import TrustedMintsQuery from "../queries/trusted-mints";
import useReplaceableEvent from "./use-replaceable-event";

export default function useTrustedMints(pubkey?: string, force?: boolean) {
  useReplaceableEvent(pubkey && { kind: 10019, pubkey }, undefined, force);

  return useStoreQuery(TrustedMintsQuery, pubkey ? [pubkey] : undefined);
}
