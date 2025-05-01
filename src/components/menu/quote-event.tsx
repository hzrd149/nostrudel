import { MenuItem, useToast } from "@chakra-ui/react";
import { getZapSender } from "applesauce-core/helpers";
import { kinds, nip19, NostrEvent } from "nostr-tools";
import { useCallback, useContext, useMemo } from "react";

import useUserProfile from "../../hooks/use-user-profile";
import { PostModalContext } from "../../providers/route/post-modal-provider";
import { getSharableEventAddress } from "../../services/relay-hints";
import { QuoteIcon } from "../icons";

export default function QuoteEventMenuItem({ event }: { event: NostrEvent }) {
  const toast = useToast();
  const address = useMemo(() => getSharableEventAddress(event), [event]);
  const metadata = useUserProfile(event.pubkey);
  const { openModal } = useContext(PostModalContext);

  const share = useCallback(async () => {
    let content = "";

    // if its a zap, mention the original author
    if (event.kind === kinds.Zap) {
      const sender = getZapSender(event);
      content += "nostr:" + nip19.npubEncode(sender) + "\n";
    }

    content += "\nnostr:" + address;
    openModal({ cacheFormKey: null, initContent: content });
  }, [metadata, event, toast, address]);

  return (
    address && (
      <MenuItem onClick={share} icon={<QuoteIcon />}>
        Quote Event
      </MenuItem>
    )
  );
}
