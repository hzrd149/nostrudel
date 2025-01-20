import { useEffect, useState } from "react";
import { generateSecretKey, finalizeEvent, kinds } from "nostr-tools";
import { Avatar, Button, Flex, Heading, Text, useToast } from "@chakra-ui/react";
import { bytesToHex } from "@noble/hashes/utils";
import { ProfileContent, unixNow } from "applesauce-core/helpers";

import { containerProps } from "./common";
import { nostrBuildUploadImage } from "../../../helpers/media-upload/nostr-build";
import accountService from "../../../services/account";
import { COMMON_CONTACT_RELAYS } from "../../../const";
import { DraftNostrEvent } from "../../../types/nostr-event";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import NsecAccount from "../../../classes/accounts/nsec-account";

export default function CreateStep({
  metadata,
  profileImage,
  relays,
  onBack,
  onSubmit,
}: {
  metadata: ProfileContent;
  relays: string[];
  profileImage?: File;
  onBack: () => void;
  onSubmit: (secretKey: string) => void;
}) {
  const publish = usePublishEvent();
  const toast = useToast();

  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (profileImage) {
      const url = URL.createObjectURL(profileImage);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [profileImage]);

  const [loading, setLoading] = useState(false);
  const createProfile = async () => {
    setLoading(true);
    try {
      const hex = generateSecretKey();

      const uploaded = profileImage
        ? await nostrBuildUploadImage(profileImage, async (draft) => finalizeEvent(draft, hex))
        : undefined;

      // create profile
      const kind0 = finalizeEvent(
        {
          content: JSON.stringify({ ...metadata, picture: uploaded?.url }),
          created_at: unixNow(),
          kind: kinds.Metadata,
          tags: [],
        },
        hex,
      );

      await publish("Create Profile", kind0, [...relays, ...COMMON_CONTACT_RELAYS]);

      // login
      const account = NsecAccount.newKey();
      accountService.addAccount(account);
      accountService.switchAccount(account.pubkey);

      // set relays
      const draft: DraftNostrEvent = {
        kind: kinds.RelayList,
        content: "",
        tags: relays.map((url) => ["r", url]),
        created_at: unixNow(),
      };
      const signed = finalizeEvent(draft, hex);
      await publish("Set Mailbox Relays", signed, relays);

      onSubmit(bytesToHex(hex));
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
    setLoading(false);
  };

  return (
    <Flex gap="4" {...containerProps}>
      <Avatar size="xl" src={preview} />
      <Flex direction="column" alignItems="center">
        <Heading size="md">{metadata.displayName}</Heading>
        {metadata.about && <Text>{metadata.about}</Text>}
      </Flex>
      <Button w="full" colorScheme="primary" isLoading={loading} onClick={createProfile} autoFocus>
        Create profile
      </Button>
      <Button w="full" variant="link" onClick={onBack}>
        Back
      </Button>
    </Flex>
  );
}
