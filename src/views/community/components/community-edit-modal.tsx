import { useMemo } from "react";
import { ModalProps } from "@chakra-ui/react";
import dayjs from "dayjs";

import { DraftNostrEvent, NostrEvent } from "../../../types/nostr-event";
import {
  COMMUNITY_DEFINITION_KIND,
  getCommunityDescription,
  getCommunityImage,
  getCommunityLinks,
  getCommunityMods,
  getCommunityName,
  getCommunityRelays,
  getCommunityRules,
} from "../../../helpers/nostr/communities";
import CommunityCreateModal, { FormValues } from "../../communities/components/community-create-modal";
import { getImageSize } from "../../../helpers/image";
import { usePublishEvent } from "../../../providers/global/publish-provider";

export default function CommunityEditModal({
  isOpen,
  onClose,
  community,
  ...props
}: Omit<ModalProps, "children"> & { community: NostrEvent }) {
  const publish = usePublishEvent();

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: getCommunityName(community),
      description: getCommunityDescription(community) || "",
      banner: getCommunityImage(community) || "",
      rules: getCommunityRules(community) || "",
      mods: getCommunityMods(community) || [],
      relays: getCommunityRelays(community) || [],
      links: getCommunityLinks(community) || [],
      // ranking: getCommunityRanking(community) || "votes",
    }),
    [community],
  );

  const updateCommunity = async (values: FormValues) => {
    const draft: DraftNostrEvent = {
      kind: COMMUNITY_DEFINITION_KIND,
      created_at: dayjs().unix(),
      content: "",
      tags: [["d", getCommunityName(community)]],
    };

    if (values.description) draft.tags.push(["description", values.description]);
    if (values.banner) {
      try {
        const size = await getImageSize(values.banner);
        draft.tags.push(["image", values.banner, `${size.width}x${size.height}`]);
      } catch (e) {
        draft.tags.push(["image", values.banner]);
      }
    }
    for (const pubkey of values.mods) draft.tags.push(["p", pubkey, "", "moderator"]);
    for (const url of values.relays) draft.tags.push(["relay", url]);
    for (const [url, name] of values.links) draft.tags.push(name ? ["r", url, name] : ["r", url]);

    // if (values.ranking) draft.tags.push(["rank_mode", values.ranking]);

    const pub = await publish("Update Community", draft, values.relays);
    if (pub) onClose();
  };

  return (
    <CommunityCreateModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={updateCommunity}
      defaultValues={defaultValues}
      isUpdate
      {...props}
    />
  );
}
