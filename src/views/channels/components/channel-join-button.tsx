import { useCallback } from "react";
import dayjs from "dayjs";
import { EventTemplate, kinds, NostrEvent } from "nostr-tools";
import { Button, ButtonProps } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";

import { listAddEvent, listRemoveEvent } from "../../../helpers/nostr/lists";
import useUserChannelsList from "../../../hooks/use-user-channels-list";
import { usePublishEvent } from "../../../providers/global/publish-provider";

export default function ChannelJoinButton({
  channel,
  ...props
}: Omit<ButtonProps, "children"> & { channel: NostrEvent }) {
  const publish = usePublishEvent();
  const account = useActiveAccount();
  const { list, pointers } = useUserChannelsList(account && { pubkey: account.pubkey });

  const isSubscribed = pointers.find((e) => e.id === channel.id);

  const handleClick = useCallback(async () => {
    const favList = {
      kind: kinds.PublicChatsList,
      content: list?.content ?? "",
      created_at: dayjs().unix(),
      tags: list?.tags ?? [],
    };

    let draft: EventTemplate;
    if (isSubscribed) {
      draft = listRemoveEvent(favList, channel);
    } else {
      draft = listAddEvent(favList, channel);
    }

    await publish(isSubscribed ? "Leave Channel" : "Join Channel", draft);
  }, [isSubscribed, list, channel, publish]);

  return (
    <Button
      onClick={handleClick}
      variant={isSubscribed ? "outline" : "solid"}
      colorScheme={isSubscribed ? "red" : "green"}
      {...props}
    >
      {isSubscribed ? "Leave" : "Join"}
    </Button>
  );
}
