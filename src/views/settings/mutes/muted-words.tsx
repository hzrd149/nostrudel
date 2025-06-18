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
import { MuteWord, UnmuteWord } from "applesauce-actions/actions";
import { useActionHub, useActiveAccount, useEventModel } from "applesauce-react/hooks";
import { useCallback, useState } from "react";

import useAsyncAction from "../../../hooks/use-async-action";
import { MutesQuery } from "../../../models";
import { usePublishEvent } from "../../../providers/global/publish-provider";

export default function MutedWordsSection() {
  const account = useActiveAccount();
  const publish = usePublishEvent();
  const actions = useActionHub();
  const [newWord, setNewWord] = useState("");

  const mutes = useEventModel(MutesQuery, account && [account?.pubkey]);

  const addWord = useAsyncAction(async () => {
    const word = newWord.trim().toLowerCase();
    if (!word || mutes?.words.has(word)) return;

    await actions.exec(MuteWord, word).forEach((e) => publish("Add muted word", e));
    setNewWord("");
  }, [actions, newWord, mutes, publish]);

  const removeWord = useCallback(
    async (wordToRemove: string) => {
      await actions.exec(UnmuteWord, wordToRemove).forEach((e) => publish("Remove muted word", e));
    },
    [actions, publish],
  );

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addWord.run();
    }
  };

  return (
    <VStack spacing={2} align="stretch">
      <Box>
        <Heading size="md">Muted Words</Heading>
        <Text color="gray.500" fontSize="sm">
          Hide events that contain these words or phrases.
        </Text>
      </Box>

      <HStack>
        <Input
          placeholder="Enter word or phrase to mute"
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <Button onClick={addWord.run} leftIcon={<AddIcon />} isLoading={addWord.loading} isDisabled={!newWord.trim()}>
          Add
        </Button>
      </HStack>

      {mutes && mutes.words.size > 0 && (
        <Flex wrap="wrap" gap={2}>
          {Array.from(mutes.words).map((word) => (
            <Tag key={word} size="lg" colorScheme="red" variant="subtle">
              <TagLabel>{word}</TagLabel>
              <TagCloseButton onClick={() => removeWord(word)} />
            </Tag>
          ))}
        </Flex>
      )}
    </VStack>
  );
}
