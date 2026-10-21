import { Alert, AlertDescription, AlertIcon, Button } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useState } from "react";

import Timestamp from "../timestamp";

/**
 * Tells the user an installed napplet changed since they last opened it on this device. Mount it
 * keyed by the manifest id: the version is captured on mount, before the open is recorded.
 */
export default function NappletUpdateNotice({
  event,
  openedVersion,
  onShowVersions,
}: {
  event: NostrEvent;
  openedVersion?: number;
  onShowVersions: () => void;
}) {
  const [previous] = useState(openedVersion);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || previous === undefined || event.created_at <= previous) return null;

  return (
    <Alert status="info" flexShrink={0}>
      <AlertIcon />
      <AlertDescription flexGrow={1}>
        Updated <Timestamp timestamp={event.created_at} fontWeight="bold" /> since you last opened it
      </AlertDescription>
      <Button variant="ghost" size="sm" flexShrink={0} onClick={onShowVersions}>
        Versions
      </Button>
      <Button variant="ghost" size="sm" flexShrink={0} onClick={() => setDismissed(true)}>
        Dismiss
      </Button>
    </Alert>
  );
}
