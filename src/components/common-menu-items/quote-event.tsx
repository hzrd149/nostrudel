import { useCallback, useContext, useMemo } from "react";
import { MenuItem, useToast } from "@chakra-ui/react";

import { NostrEvent } from "../../types/nostr-event";
import { QuoteEventIcon } from "../icons";
import useUserMetadata from "../../hooks/use-user-metadata";
import { PostModalContext } from "../../providers/route/post-modal-provider";
import relayHintService from "../../services/event-relay-hint";

export default function QuoteEventMenuItem({ event }: { event: NostrEvent }) {
  const toast = useToast();
  const address = useMemo(() => relayHintService.getSharableEventAddress(event), [event]);
  const metadata = useUserMetadata(event.pubkey);
  const { openModal } = useContext(PostModalContext);

  const share = useCallback(async () => {
    openModal({ cacheFormKey: null, initContent: "\nnostr:" + address });
  }, [metadata, event, toast, address]);

  return (
    address && (
      <MenuItem onClick={share} icon={<QuoteEventIcon />}>
        Quote Event
      </MenuItem>
    )
  );
}
