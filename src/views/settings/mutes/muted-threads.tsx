import { AddIcon } from "@chakra-ui/icons";
import { Alert, AlertIcon, Box, Button, Card, Heading, HStack, Input, Link, Text, VStack } from "@chakra-ui/react";
import { MuteThread, UnmuteThread } from "applesauce-actions/actions";
import { useActionHub, useActiveAccount, useEventModel } from "applesauce-react/hooks";
import { nip19 } from "nostr-tools";
import { neventEncode } from "nostr-tools/nip19";
import { useCallback, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import UserAvatar from "../../../components/user/user-avatar";
import useSingleEvent from "../../../hooks/use-single-event";
import { MutesQuery } from "../../../models";
import { usePublishEvent } from "../../../providers/global/publish-provider";

function MutedThread({ thread, onRemove }: { thread: string; onRemove: (thread: string) => void }) {
  const event = useSingleEvent(thread);
  const nevent = useMemo(() => event && neventEncode({ id: thread }), [thread]);

  return (
    <Card p={3} justify="space-between" align="center" variant="outline" flexDirection="row" gap="2">
      {event && <UserAvatar pubkey={event.pubkey} size="sm" />}
      <Box flex={1} overflow="hidden">
        <Link as={RouterLink} to={`/l/${nevent}`} color="blue.500" fontSize="sm" isTruncated display="block">
          View Thread
        </Link>
        <Text fontSize="xs" color="gray.500" isTruncated>
          {nevent}
        </Text>
      </Box>
      <Button size="sm" colorScheme="red" variant="ghost" onClick={() => onRemove(thread)}>
        Remove
      </Button>
    </Card>
  );
}

export default function MutedThreadsSection() {
  const account = useActiveAccount();
  const publish = usePublishEvent();
  const actions = useActionHub();
  const [newNevent, setNewNevent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const muted = useEventModel(MutesQuery, account && [account?.pubkey]);

  const [adding, setAdding] = useState(false);
  const addThread = useCallback(async () => {
    setAdding(true);
    setError(null);
    try {
      const decoded = nip19.decode(newNevent.replace(/^nostr:/, "").trim());
      if (decoded.type !== "nevent") throw new Error("Please enter a valid nevent (starts with nevent1)");

      // Check if already muted
      if (muted?.threads.has(decoded.data.id)) throw new Error("This thread is already muted");

      await actions.exec(MuteThread, decoded.data).forEach((e) => publish("Add muted thread", e));
      setNewNevent("");
    } catch (e) {
      if (e instanceof Error) setError(e.message);
    } finally {
      setAdding(false);
    }
  }, [actions, newNevent, muted, publish]);

  const removeThread = useCallback(
    async (eventId: string) => {
      await actions.exec(UnmuteThread, eventId).forEach((e) => publish("Remove muted thread", e));
    },
    [publish, actions],
  );

  return (
    <VStack spacing={2} align="stretch">
      <Box>
        <Heading size="md">Muted Threads</Heading>
        <Text color="gray.500" fontSize="sm">
          Hide specific threads/events. Paste a nevent (nip-19 event identifier) to mute a thread.
        </Text>
      </Box>

      <VStack spacing={3} align="stretch">
        <HStack>
          <Input
            placeholder="nevent1... (NIP-19 event identifier)"
            value={newNevent}
            onChange={(e) => {
              setNewNevent(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && addThread()}
            isInvalid={!!error}
          />
          <Button onClick={addThread} leftIcon={<AddIcon />} isLoading={adding} isDisabled={!newNevent.trim()}>
            Add
          </Button>
        </HStack>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}
      </VStack>

      {muted && muted.threads.size > 0 && (
        <VStack spacing={2} align="stretch">
          {Array.from(muted.threads).map((thread) => (
            <MutedThread key={thread} thread={thread} onRemove={removeThread} />
          ))}
        </VStack>
      )}
    </VStack>
  );
}
