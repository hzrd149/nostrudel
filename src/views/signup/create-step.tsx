import { useEffect, useState } from "react";
import { getPublicKey, generateSecretKey, finalizeEvent, kinds } from "nostr-tools";
import { Avatar, Button, Flex, Heading, Text, useToast } from "@chakra-ui/react";
import { bytesToHex } from "@noble/hashes/utils";
import dayjs from "dayjs";

import { Kind0ParsedContent } from "../../helpers/user-metadata";
import { containerProps } from "./common";
import { nostrBuildUploadImage } from "../../helpers/nostr-build";
import NostrPublishAction from "../../classes/nostr-publish-action";
import accountService from "../../services/account";
import signingService from "../../services/signing";
import clientRelaysService from "../../services/client-relays";
import { RelayMode } from "../../classes/relay";
import { COMMON_CONTACT_RELAY } from "../../const";

export default function CreateStep({
  metadata,
  profileImage,
  relays,
  onBack,
  onSubmit,
}: {
  metadata: Kind0ParsedContent;
  relays: string[];
  profileImage?: File;
  onBack: () => void;
  onSubmit: (secretKey: string) => void;
}) {
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
          created_at: dayjs().unix(),
          kind: kinds.Metadata,
          tags: [],
        },
        hex,
      );

      new NostrPublishAction("Create Profile", [...relays, COMMON_CONTACT_RELAY], kind0);

      // login
      const pubkey = getPublicKey(hex);
      const encrypted = await signingService.encryptSecKey(bytesToHex(hex));
      accountService.addAccount({ type: "local", pubkey, relays, ...encrypted, readonly: false });
      accountService.switchAccount(pubkey);

      // set relays
      await clientRelaysService.postUpdatedRelays(relays.map((url) => ({ url, mode: RelayMode.ALL })));

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
        <Heading size="md">{metadata.display_name}</Heading>
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
