import { Alert, AlertDescription, AlertIcon, Heading, Link, Text, VStack } from "@chakra-ui/react";
import { addRelayTag, removeRelayTag } from "applesauce-factory/operations/tag";
import { useActiveAccount, useEventFactory, useObservableMemo } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";

import { getRelaysFromList } from "../../../helpers/nostr/lists";
import useAddressableEvent from "../../../hooks/use-addressable-event";
import useAsyncAction from "../../../hooks/use-async-action";
import { useRelayInfo } from "../../../hooks/use-relay-info";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import AddRelayForm from "../relays/add-relay-form";
import RelayControl from "../relays/relay-control";
import pool from "../../../services/pool";

function RelayEntry({ url, onRemove }: { url: string; onRemove: () => void }) {
  const authRequiredForPublishing = useObservableMemo(() => pool.relay(url).authRequiredForPublish$, [url]);
  const authRequiredForReading = useObservableMemo(() => pool.relay(url).authRequiredForRead$, [url]);
  const { info } = useRelayInfo(url);

  return (
    <RelayControl
      url={url}
      onRemove={onRemove}
      details={
        <>
          {authRequiredForReading && (
            <Text color="green.500" fontSize="sm">
              Authentication required for reading (Protects your privacy)
            </Text>
          )}
          {authRequiredForPublishing && (
            <Text color="red.500" fontSize="sm">
              Authentication required for publishing (This may prevent users from sending you messages)
            </Text>
          )}
          {info?.supported_nips.includes(40) && (
            <Text color="green.500" fontSize="sm">
              Supports disappearing messages
            </Text>
          )}
        </>
      }
    />
  );
}

export default function DirectMessageRelaysSection() {
  const account = useActiveAccount();
  const publish = usePublishEvent();
  const factory = useEventFactory();

  const dmRelayList = useAddressableEvent(
    account ? { kind: kinds.DirectMessageRelaysList, pubkey: account.pubkey } : undefined,
  );

  const relays = dmRelayList ? getRelaysFromList(dmRelayList) : [];

  const addRelay = useAsyncAction(async (relay: string) => {
    const draft = await factory.modifyTags(
      dmRelayList || {
        kind: kinds.DirectMessageRelaysList,
        content: "",
        tags: [],
        created_at: Math.floor(Date.now() / 1000),
      },
      addRelayTag(relay),
    );
    const signed = await factory.sign(draft);
    await publish("Add DM relay", signed);
  });

  const removeRelay = useAsyncAction(async (relay: string) => {
    if (!dmRelayList) return;
    const draft = await factory.modifyTags(dmRelayList, removeRelayTag(relay));
    const signed = await factory.sign(draft);
    await publish("Remove DM relay", signed);
  });

  return (
    <VStack spacing="4" align="stretch">
      <VStack spacing="1" align="start">
        <Heading size="md">Message inbox relays</Heading>
        <Text fontSize="sm" color="gray.500">
          Relays where your encrypted direct messages will be sent and received according to{" "}
          <Link
            color="blue.500"
            isExternal
            href="https://github.com/nostr-protocol/nips/blob/master/17.md"
            textDecoration="underline"
          >
            NIP-17
          </Link>
          . Keep this list small (1-3 relays) for better performance.
        </Text>
      </VStack>

      <VStack spacing="2" align="stretch">
        {relays.map((relay) => (
          <RelayEntry key={relay} url={relay} onRemove={() => removeRelay.run(relay)} />
        ))}
        {relays.length === 0 && (
          <Alert status="warning" variant="subtle">
            <AlertIcon />
            <AlertDescription>
              No direct message relays configured. Add relays below to enable NIP-17 encrypted messaging.
            </AlertDescription>
          </Alert>
        )}

        <AddRelayForm onSubmit={addRelay.run} />
      </VStack>
    </VStack>
  );
}
