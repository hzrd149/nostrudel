import { memo } from "react";
import { verifySignature } from "nostr-tools";

import { NostrEvent } from "../types/nostr-event";
import { CheckIcon, VerificationFailed } from "./icons";
import useAppSettings from "../hooks/use-app-settings";

function EventVerificationIcon({ event }: { event: NostrEvent }) {
  const { showSignatureVerification } = useAppSettings();
  if (!showSignatureVerification) return null;

  if (!verifySignature(event)) {
    return <VerificationFailed color="red.500" />;
  }
  return <CheckIcon color="green.500" />;
}
export default memo(EventVerificationIcon);
