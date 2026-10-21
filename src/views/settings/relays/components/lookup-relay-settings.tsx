import { Button, Flex, Heading, Text, useDisclosure } from "@chakra-ui/react";
import { LookupRelayListFactory } from "applesauce-common/factories";
import { useActiveAccount, use$ } from "applesauce-react/hooks";

import RelayFavicon from "../../../../components/relay/relay-favicon";
import RelayLink from "../../../../components/relay/relay-link";
import { RECOMMENDED_LOOKUP_RELAYS } from "../../../../const";
import useAsyncAction from "../../../../hooks/use-async-action";
import useCastUser from "../../../../hooks/use-cast-user";
import { usePublishEvent } from "../../../../providers/global/publish-provider";
import AddRelayForm from "./add-relay-form";
import DiscoverLookupRelaysModal from "./discover-lookup-relays-modal";
import RelayControl from "./relay-control";

export default function LookupRelaySettings() {
  const publish = usePublishEvent();
  const account = useActiveAccount();
  const lookupRelayListCast = use$(useCastUser(account?.pubkey)?.lookupRelayList$);
  const lookupRelayList = lookupRelayListCast?.event;
  const discoverModal = useDisclosure();

  const lookupRelays = lookupRelayListCast?.relays ?? [];

  const addRelay = useAsyncAction(
    async (url: string | string[]) => {
      const draft = await (lookupRelayList
        ? LookupRelayListFactory.modify(lookupRelayList).addRelay(url)
        : LookupRelayListFactory.create().addRelay(url));
      await publish("Add lookup relay", draft);
    },
    [lookupRelayList, publish],
  );

  const removeRelay = useAsyncAction(
    async (url: string) => {
      if (!lookupRelayList) return;
      const draft = await LookupRelayListFactory.modify(lookupRelayList).removeRelay(url);
      await publish("Remove lookup relay", draft);
    },
    [lookupRelayList, publish],
  );

  return (
    <Flex direction="column" gap="2">
      <Heading size="md">Lookup Relays</Heading>
      <Text color="GrayText">
        Lookup relays are special indexing relays that are used to find user profiles and user mailboxes. They are
        published as a relay list (kind 10086) so all your nostr apps can share them.
      </Text>

      {!account ? (
        <>
          <Text>Sign in to publish your own lookup relay list. Using the recommended lookup relays:</Text>
          {RECOMMENDED_LOOKUP_RELAYS.map((url) => (
            <Flex key={url} gap="2" alignItems="center" pl="2">
              <RelayFavicon relay={url} size="sm" />
              <RelayLink relay={url} isTruncated />
            </Flex>
          ))}
        </>
      ) : (
        <>
          {lookupRelays.length === 0 && (
            <Text color="GrayText" fontStyle="italic">
              You have not published a lookup relay list yet, the recommended lookup relays are being used. Add a relay
              or discover the ones your contacts use to publish your own list.
            </Text>
          )}

          {lookupRelays.map((url) => (
            <RelayControl key={url} url={url} onRemove={() => removeRelay.run(url)} />
          ))}
          <Flex gap="2">
            <AddRelayForm onSubmit={addRelay.run} flex={1} />
            <Button variant="outline" onClick={discoverModal.onOpen}>
              Discover
            </Button>
          </Flex>
          {discoverModal.isOpen && (
            <DiscoverLookupRelaysModal
              isOpen={discoverModal.isOpen}
              onClose={discoverModal.onClose}
              pubkey={account.pubkey}
              hidden={lookupRelays}
              onSelect={addRelay.run}
            />
          )}
        </>
      )}
    </Flex>
  );
}
