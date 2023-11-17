import { useCallback } from "react";
import dayjs from "dayjs";
import { Button, ButtonProps, useToast } from "@chakra-ui/react";

import { DraftNostrEvent, NostrEvent, isDTag } from "../../../types/nostr-event";
import useJoinedCommunitiesList from "../../../hooks/use-communities-joined-list";
import useCurrentAccount from "../../../hooks/use-current-account";
import { getCommunityName } from "../../../helpers/nostr/communities";
import { COMMUNITIES_LIST_KIND, listAddCoordinate, listRemoveCoordinate } from "../../../helpers/nostr/lists";
import { getEventCoordinate } from "../../../helpers/nostr/events";
import { useSigningContext } from "../../../providers/signing-provider";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import clientRelaysService from "../../../services/client-relays";

export default function CommunityJoinButton({
  community,
  ...props
}: Omit<ButtonProps, "children"> & { community: NostrEvent }) {
  const account = useCurrentAccount();
  const { list, pointers } = useJoinedCommunitiesList(account?.pubkey);
  const { requestSignature } = useSigningContext();
  const toast = useToast();

  const isSubscribed = pointers.find(
    (cord) => cord.identifier === getCommunityName(community) && cord.pubkey === community.pubkey,
  );

  const handleClick = useCallback(async () => {
    try {
      const favList = {
        kind: COMMUNITIES_LIST_KIND,
        content: "",
        created_at: dayjs().unix(),
        tags: list?.tags.filter((t) => !isDTag(t)) ?? [],
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
  }, [isSubscribed, list, community, requestSignature, toast]);

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
