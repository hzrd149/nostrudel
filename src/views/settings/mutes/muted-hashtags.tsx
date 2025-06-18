import { AddIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useActionHub, useActiveAccount, useEventModel } from "applesauce-react/hooks";
import { useCallback, useState } from "react";

import { MuteHashtag, UnmuteHashtag } from "applesauce-actions/actions";
import useAsyncAction from "../../../hooks/use-async-action";
import { MutesQuery } from "../../../models";
import { usePublishEvent } from "../../../providers/global/publish-provider";

export default function MutedHashtagsSection() {
  const account = useActiveAccount();
  const publish = usePublishEvent();
  const actions = useActionHub();
  const [newHashtag, setNewHashtag] = useState("");

  const muted = useEventModel(MutesQuery, account && [account?.pubkey]);

  const addHashtag = useAsyncAction(async () => {
    const hashtag = newHashtag.trim().replace(/^#/, "").toLowerCase();
    if (!hashtag || muted?.hashtags.has(hashtag)) return;

    // TODO: Create mute list if its missing
    await actions.exec(MuteHashtag, hashtag).forEach((e) => publish("Add muted hashtag", e));
    setNewHashtag("");
  }, [actions, newHashtag, muted, publish]);

  const removeHashtag = useCallback(
    async (hashtagToRemove: string) => {
      await actions.exec(UnmuteHashtag, hashtagToRemove).forEach((e) => publish("Remove muted hashtag", e));
    },
    [actions, publish],
  );

  return (
    <VStack spacing={2} align="stretch">
      <Box>
        <Heading size="md">Muted Hashtags</Heading>
        <Text color="gray.500" fontSize="sm">
          Hide events that contain these hashtags.
        </Text>
      </Box>

      <HStack>
        <Input
          placeholder="Enter hashtag to mute (without #)"
          value={newHashtag}
          onChange={(e) => setNewHashtag(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addHashtag.run()}
        />
        <Button
          onClick={addHashtag.run}
          leftIcon={<AddIcon />}
          isLoading={addHashtag.loading}
          isDisabled={!newHashtag.trim()}
        >
          Add
        </Button>
      </HStack>

      {muted && muted.hashtags.size > 0 && (
        <Flex wrap="wrap" gap={2}>
          {Array.from(muted.hashtags).map((hashtag) => (
            <Tag key={hashtag} size="lg" colorScheme="red" variant="subtle">
              <TagLabel>#{hashtag}</TagLabel>
              <TagCloseButton onClick={() => removeHashtag(hashtag)} />
            </Tag>
          ))}
        </Flex>
      )}
    </VStack>
  );
}
