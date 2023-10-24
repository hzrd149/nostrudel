import { useMemo } from "react";
import { ModalProps, useDisclosure, useToast } from "@chakra-ui/react";
import dayjs from "dayjs";

import { DraftNostrEvent, NostrEvent } from "../../../types/nostr-event";
import { useSigningContext } from "../../../providers/signing-provider";
import {
  COMMUNITY_DEFINITION_KIND,
  getCommunityDescription,
  getCommunityImage,
  getCommunityLinks,
  getCommunityMods,
  getCommunityName,
  getCommunityRanking,
  getCommunityRelays,
  getCommunityRules,
} from "../../../helpers/nostr/communities";
import CommunityCreateModal, { FormValues } from "../../communities/components/community-create-modal";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import clientRelaysService from "../../../services/client-relays";
import { unique } from "../../../helpers/array";
import replaceableEventLoaderService from "../../../services/replaceable-event-requester";
import { getImageSize } from "../../../helpers/image";

export default function CommunityEditModal({
  isOpen,
  onClose,
  community,
  ...props
}: Omit<ModalProps, "children"> & { community: NostrEvent }) {
  const toast = useToast();
  const { requestSignature } = useSigningContext();

  const defaultValues = useMemo<FormValues>(
    () => ({
      name: getCommunityName(community),
      description: getCommunityDescription(community) || "",
      banner: getCommunityImage(community) || "",
      rules: getCommunityRules(community) || "",
      mods: getCommunityMods(community) || [],
      relays: getCommunityRelays(community) || [],
      links: getCommunityLinks(community) || [],
      ranking: getCommunityRanking(community) || "votes",
    }),
    [community],
  );

  const updateCommunity = async (values: FormValues) => {
    try {
      const draft: DraftNostrEvent = {
        kind: COMMUNITY_DEFINITION_KIND,
        created_at: dayjs().unix(),
        content: "",
        tags: [["d", getCommunityName(community)]],
      };

      for (const pubkey of values.mods) {
        draft.tags.push(["p", pubkey, "", "moderator"]);
      }
      for (const url of values.relays) {
        draft.tags.push(["relay", url]);
      }

      if (values.description) draft.tags.push(["description", values.description]);
      if (values.banner) {
        try {
          const size = await getImageSize(values.banner);
          draft.tags.push(["image", values.banner, `${size.width}x${size.height}`]);
        } catch (e) {
          draft.tags.push(["image", values.banner]);
        }
      }
      if (values.ranking) draft.tags.push(["rank_mode", values.ranking]);

      const signed = await requestSignature(draft);
      new NostrPublishAction(
        "Update Community",
        unique([...clientRelaysService.getWriteUrls(), ...values.relays]),
        signed,
      );

      replaceableEventLoaderService.handleEvent(signed);

      onClose();
    } catch (e) {
      console.log(e);

      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
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
