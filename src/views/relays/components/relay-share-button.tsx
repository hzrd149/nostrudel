import { IconButton, IconButtonProps } from "@chakra-ui/react";
import dayjs from "dayjs";
import { EventTemplate } from "nostr-tools";
import { useCallback } from "react";

import { RepostIcon } from "../../../components/icons";
import { usePublishEvent } from "../../../providers/global/publish-provider";

export function RelayShareButton({
  relay,
  ...props
}: { relay: string } & Omit<IconButtonProps, "icon" | "aria-label">) {
  const publish = usePublishEvent();

  const recommendRelay = useCallback(async () => {
    const draft: EventTemplate = {
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
