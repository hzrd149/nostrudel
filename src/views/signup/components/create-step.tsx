import { Avatar, Button, Flex, Heading, Text, useToast } from "@chakra-ui/react";
import { bytesToHex } from "@noble/hashes/utils";
import { SimpleAccount } from "applesauce-accounts/accounts";
import { ProfileContent, unixNow } from "applesauce-core/helpers";
import { useAccountManager } from "applesauce-react/hooks";
import { EventTemplate, finalizeEvent, generateSecretKey, kinds } from "nostr-tools";
import { useEffect, useState } from "react";

import { DEFAULT_LOOKUP_RELAYS } from "../../../const";
import { nostrBuildUploadImage } from "../../../helpers/media-upload/nostr-build";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import { containerProps } from "./common";

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
  const manager = useAccountManager();

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
      const key = generateSecretKey();

      const uploaded = profileImage
        ? await nostrBuildUploadImage(profileImage, async (draft) => finalizeEvent(draft, key))
        : undefined;

      // create profile
      const kind0 = finalizeEvent(
        {
          content: JSON.stringify({ ...metadata, picture: uploaded?.url }),
          created_at: unixNow(),
          kind: kinds.Metadata,
          tags: [],
        },
        key,
      );

      await publish("Create Profile", kind0, [...relays, ...DEFAULT_LOOKUP_RELAYS]);

      // login
      const account = SimpleAccount.fromKey(key);
      manager.addAccount(account);
      manager.setActive(account);

      // set relays
      const draft: EventTemplate = {
        kind: kinds.RelayList,
        content: "",
        tags: relays.map((url) => ["r", url]),
        created_at: unixNow(),
      };
      const signed = finalizeEvent(draft, key);
      await publish("Set Mailbox Relays", signed, relays);

      onSubmit(bytesToHex(key));
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
