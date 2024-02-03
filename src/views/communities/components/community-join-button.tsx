import { useCallback } from "react";
import dayjs from "dayjs";
import { Button, ButtonProps } from "@chakra-ui/react";

import { DraftNostrEvent, NostrEvent, isDTag } from "../../../types/nostr-event";
import useUserCommunitiesList from "../../../hooks/use-user-communities-list";
import useCurrentAccount from "../../../hooks/use-current-account";
import { getCommunityName } from "../../../helpers/nostr/communities";
import { COMMUNITIES_LIST_KIND, listAddCoordinate, listRemoveCoordinate } from "../../../helpers/nostr/lists";
import { getEventCoordinate } from "../../../helpers/nostr/events";
import { usePublishEvent } from "../../../providers/global/publish-provider";

export default function CommunityJoinButton({
  community,
  ...props
}: Omit<ButtonProps, "children"> & { community: NostrEvent }) {
  const publish = usePublishEvent();
  const account = useCurrentAccount();
  const { list, pointers } = useUserCommunitiesList(account?.pubkey);

  const isSubscribed = pointers.find(
    (cord) => cord.identifier === getCommunityName(community) && cord.pubkey === community.pubkey,
  );

  const handleClick = useCallback(async () => {
    const favList = {
      kind: COMMUNITIES_LIST_KIND,
      content: list?.content ?? "",
      created_at: dayjs().unix(),
      tags: list?.tags.filter((t) => !isDTag(t)) ?? [],
    };

    let draft: DraftNostrEvent;
    if (isSubscribed) draft = listRemoveCoordinate(favList, getEventCoordinate(community));
    else draft = listAddCoordinate(favList, getEventCoordinate(community));

    await publish(isSubscribed ? "Unsubscribe" : "Subscribe", draft);
  }, [isSubscribed, list, community, publish]);

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
