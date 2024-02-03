import { useCallback } from "react";
import dayjs from "dayjs";
import { IconButton, IconButtonProps } from "@chakra-ui/react";

import { DraftNostrEvent } from "../../../types/nostr-event";
import { RepostIcon } from "../../../components/icons";
import { usePublishEvent } from "../../../providers/global/publish-provider";

export function RelayShareButton({
  relay,
  ...props
}: { relay: string } & Omit<IconButtonProps, "icon" | "aria-label">) {
  const publish = usePublishEvent();

  const recommendRelay = useCallback(async () => {
    const draft: DraftNostrEvent = {
      kind: 2,
      content: relay,
      tags: [],
      created_at: dayjs().unix(),
    };

    await publish("Share Relay", draft);
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
