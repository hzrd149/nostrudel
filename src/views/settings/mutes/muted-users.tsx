import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Card,
  CardBody,
  Collapse,
  Flex,
  Heading,
  HStack,
  IconButton,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { MuteUser, UnmuteUser } from "applesauce-actions/actions";
import { useActionRunner, useActiveAccount, useEventModel } from "applesauce-react/hooks";
import { useCallback, useState } from "react";

import { TrashIcon } from "../../../components/icons";
import UserAutocomplete from "../../../components/user-autocomplete";
import UserAvatar from "../../../components/user/user-avatar";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import UserLink from "../../../components/user/user-link";
import useAsyncAction from "../../../hooks/use-async-action";
import { MutesQuery } from "../../../models";
import { usePublishEvent } from "../../../providers/global/publish-provider";

function MutedUserRow({ pubkey, onRemove }: { pubkey: string; onRemove: () => void }) {
  return (
    <Card>
      <CardBody p="2" display="flex" alignItems="center" gap="2">
        <UserAvatar pubkey={pubkey} size="sm" />
        <Flex direction="column" flex={1} overflow="hidden">
          <UserLink pubkey={pubkey} fontWeight="bold" />
          <UserDnsIdentity pubkey={pubkey} />
        </Flex>
        <IconButton
          icon={<TrashIcon boxSize={5} />}
          onClick={onRemove}
          aria-label="Remove from muted list"
          variant="ghost"
          colorScheme="red"
        />
      </CardBody>
    </Card>
  );
}

export default function MutedUsersSection() {
  const account = useActiveAccount();
  const publish = usePublishEvent();
  const actions = useActionRunner();
  const [newPubkey, setNewPubkey] = useState("");
  const [showList, setShowList] = useState(false);

  const muted = useEventModel(MutesQuery, account && [account.pubkey]);

  const addUser = useAsyncAction(async () => {
    if (!newPubkey || muted?.pubkeys.has(newPubkey)) return;

    await actions.exec(MuteUser, newPubkey).forEach((e) => publish("Mute user", e));
    setNewPubkey("");
  }, [actions, newPubkey, muted, publish]);

  const removeUser = useCallback(
    async (pubkeyToRemove: string) => {
      await actions.exec(UnmuteUser, pubkeyToRemove).forEach((e) => publish("Unmute user", e));
    },
    [actions, publish],
  );

  if (!account) return null;

  return (
    <VStack spacing={2} align="stretch">
      <Box>
        <Heading size="md">Muted Users</Heading>
        <Text color="gray.500" fontSize="sm">
          Hide all content from these users.
        </Text>
      </Box>

      <HStack>
        <UserAutocomplete
          hex
          value={newPubkey}
          onSelectUser={setNewPubkey}
          onChange={(e) => setNewPubkey(e.target.value)}
          placeholder="Search for a user to mute"
        />
        <Button onClick={addUser.run} isLoading={addUser.loading} isDisabled={!newPubkey} flexShrink={0}>
          Add
        </Button>
      </HStack>

      {muted && muted.pubkeys.size > 0 && (
        <>
          <Button
            variant="ghost"
            alignSelf="flex-start"
            onClick={() => setShowList((v) => !v)}
            rightIcon={showList ? <ChevronUpIcon /> : <ChevronDownIcon />}
          >
            {showList ? "Hide" : "Show"} {muted.pubkeys.size} muted user{muted.pubkeys.size !== 1 ? "s" : ""}
          </Button>
          <Collapse in={showList}>
            <SimpleGrid spacing={2} columns={{ base: 1, md: 2, xl: 3 }}>
              {Array.from(muted.pubkeys).map((pubkey) => (
                <MutedUserRow key={pubkey} pubkey={pubkey} onRemove={() => removeUser(pubkey)} />
              ))}
            </SimpleGrid>
          </Collapse>
        </>
      )}
    </VStack>
  );
}
