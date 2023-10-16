import { useCallback } from "react";
import dayjs from "dayjs";
import { Button, ButtonProps, useToast } from "@chakra-ui/react";

import { DraftNostrEvent, NostrEvent } from "../../../types/nostr-event";
import useSubscribedCommunitiesList from "../../../hooks/use-subscribed-communities-list";
import { useCurrentAccount } from "../../../hooks/use-current-account";
import { SUBSCRIBED_COMMUNITIES_LIST_IDENTIFIER, getCommunityName } from "../../../helpers/nostr/communities";
import { NOTE_LIST_KIND, listAddCoordinate, listRemoveCoordinate } from "../../../helpers/nostr/lists";
import { getEventCoordinate } from "../../../helpers/nostr/events";
import { useSigningContext } from "../../../providers/signing-provider";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import clientRelaysService from "../../../services/client-relays";

export default function CommunityJoinButton({
  community,
  ...props
}: Omit<ButtonProps, "children"> & { community: NostrEvent }) {
  const account = useCurrentAccount();
  const { list, pointers } = useSubscribedCommunitiesList(account?.pubkey);
  const { requestSignature } = useSigningContext();
  const toast = useToast();

  const isSubscribed = pointers.find(
    (cord) => cord.identifier === getCommunityName(community) && cord.pubkey === community.pubkey,
  );

  const handleClick = useCallback(async () => {
    try {
      const favList = list || {
        kind: NOTE_LIST_KIND,
        content: "",
        created_at: dayjs().unix(),
        tags: [["d", SUBSCRIBED_COMMUNITIES_LIST_IDENTIFIER]],
      };

      let draft: DraftNostrEvent;
      if (isSubscribed) {
        draft = listRemoveCoordinate(favList, getEventCoordinate(community));
      } else {
        draft = listAddCoordinate(favList, getEventCoordinate(community));
      }

      const signed = await requestSignature(draft);

      new NostrPublishAction(isSubscribed ? "Unsubscribe" : "Subscribe", clientRelaysService.getWriteUrls(), signed);
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  }, [isSubscribed, list, community]);

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
