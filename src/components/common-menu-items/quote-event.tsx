import { useCallback, useContext, useMemo } from "react";
import { MenuItem, useToast } from "@chakra-ui/react";
import { kinds, nip19 } from "nostr-tools";

import { NostrEvent } from "../../types/nostr-event";
import { QuoteEventIcon } from "../icons";
import useUserProfile from "../../hooks/use-user-profile";
import { PostModalContext } from "../../providers/route/post-modal-provider";
import relayHintService from "../../services/event-relay-hint";
import { getParsedZap } from "../../helpers/nostr/zaps";

export default function QuoteEventMenuItem({ event }: { event: NostrEvent }) {
  const toast = useToast();
  const address = useMemo(() => relayHintService.getSharableEventAddress(event), [event]);
  const metadata = useUserProfile(event.pubkey);
  const { openModal } = useContext(PostModalContext);

  const share = useCallback(async () => {
    let content = "";

    // if its a zap, mention the original author
    if (event.kind === kinds.Zap) {
      const parsed = getParsedZap(event);
      if (parsed) content += "nostr:" + nip19.npubEncode(parsed.event.pubkey) + "\n";
    }

    content += "\nnostr:" + address;
    openModal({ cacheFormKey: null, initContent: content });
  }, [metadata, event, toast, address]);

  return (
    address && (
      <MenuItem onClick={share} icon={<QuoteEventIcon />}>
        Quote Event
      </MenuItem>
    )
  );
}
