import { useCallback } from "react";
import dayjs from "dayjs";
import { Button, ButtonProps, useToast } from "@chakra-ui/react";

import { DraftNostrEvent, NostrEvent, isDTag, isETag } from "../../../types/nostr-event";
import useCurrentAccount from "../../../hooks/use-current-account";
import { listAddEvent, listRemoveEvent } from "../../../helpers/nostr/lists";
import { useSigningContext } from "../../../providers/signing-provider";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import clientRelaysService from "../../../services/client-relays";
import useUserChannelsList from "../../../hooks/use-user-channels-list";
import { USER_CHANNELS_LIST_KIND } from "../../../helpers/nostr/channel";

export default function ChannelJoinButton({
  channel,
  ...props
}: Omit<ButtonProps, "children"> & { channel: NostrEvent }) {
  const toast = useToast();
  const account = useCurrentAccount();
  const { list, pointers } = useUserChannelsList(account?.pubkey);
  const { requestSignature } = useSigningContext();

  const isSubscribed = pointers.find((e) => e.id === channel.id);

  const handleClick = useCallback(async () => {
    try {
      const favList = {
        kind: USER_CHANNELS_LIST_KIND,
        content: list?.content ?? "",
        created_at: dayjs().unix(),
        tags: list?.tags ?? [],
      };

      let draft: DraftNostrEvent;
      if (isSubscribed) {
        draft = listRemoveEvent(favList, channel.id);
      } else {
        draft = listAddEvent(favList, channel.id);
      }

      const signed = await requestSignature(draft);

      new NostrPublishAction(
        isSubscribed ? "Leave Channel" : "Join Channel",
        clientRelaysService.getWriteUrls(),
        signed,
      );
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  }, [isSubscribed, list, channel, requestSignature, toast]);

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
