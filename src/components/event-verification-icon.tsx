import { NostrEvent } from "../types/nostr-event";
import { verifySignature } from "nostr-tools";
import { useMemo } from "react";
import { CheckIcon, VerificationFailed } from "./icons";

export default function EventVerificationIcon({ event }: { event: NostrEvent }) {
  const valid = useMemo(() => verifySignature(event), [event]);

  if (!valid) {
    return <VerificationFailed color="red.500" />;
  }
  return <CheckIcon color="green.500" />;
}
