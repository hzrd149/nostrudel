import { useCallback } from "react";
import dayjs from "dayjs";
import { IconButton, IconButtonProps, useToast } from "@chakra-ui/react";

import { useSigningContext } from "../../../providers/global/signing-provider";
import clientRelaysService from "../../../services/client-relays";
import { DraftNostrEvent } from "../../../types/nostr-event";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import { RepostIcon } from "../../../components/icons";

export function RelayShareButton({
  relay,
  ...props
}: { relay: string } & Omit<IconButtonProps, "icon" | "aria-label">) {
  const toast = useToast();
  const { requestSignature } = useSigningContext();

  const recommendRelay = useCallback(async () => {
    try {
      const writeRelays = clientRelaysService.getWriteUrls();

      const draft: DraftNostrEvent = {
        kind: 2,
        content: relay,
        tags: [],
        created_at: dayjs().unix(),
      };

      const signed = await requestSignature(draft);
      const post = new NostrPublishAction("Share Relay", writeRelays, signed);
      await post.onComplete;
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  }, []);

  return (
    <IconButton
      icon={<RepostIcon />}
      aria-label="Recommend Relay"
      title="Recommend Relay"
      onClick={recommendRelay}
      variant="ghost"
      {...props}
    />
  );
}
