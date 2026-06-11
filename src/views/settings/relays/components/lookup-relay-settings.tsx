import { Button, Flex, Heading, Text, useDisclosure } from "@chakra-ui/react";
import { LookupRelayListFactory } from "applesauce-common/factories";
import { useActiveAccount } from "applesauce-react/hooks";

import RelayFavicon from "../../../../components/relay/relay-favicon";
import RelayLink from "../../../../components/relay/relay-link";
import RelayName from "../../../../components/relay/relay-name";
import RelayDiscoveryMultiSelectModal from "../../../../components/relays/relay-discovery/multi-select-modal";
import { RECOMMENDED_LOOKUP_RELAYS } from "../../../../const";
import { getRelaysFromList } from "../../../../helpers/nostr/lists";
import useAsyncAction from "../../../../hooks/use-async-action";
import useUserLookupRelayList from "../../../../hooks/use-user-lookup-relay-list";
import { usePublishEvent } from "../../../../providers/global/publish-provider";
import AddRelayForm from "./add-relay-form";
import RelayControl from "./relay-control";

export default function LookupRelaySettings() {
  const publish = usePublishEvent();
  const account = useActiveAccount();
  const lookupRelayList = useUserLookupRelayList(account && { pubkey: account.pubkey });
  const discoverModal = useDisclosure();

  const lookupRelays = lookupRelayList ? getRelaysFromList(lookupRelayList) : [];
  const recommendations = RECOMMENDED_LOOKUP_RELAYS.filter((url) => lookupRelays.includes(url) === false);

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
              below to publish your own list.
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
            <RelayDiscoveryMultiSelectModal
              isOpen={discoverModal.isOpen}
              onClose={discoverModal.onClose}
              attributes={["Indexer"]}
              hidden={lookupRelays}
              onSelect={addRelay.run}
            />
          )}

          {recommendations.length > 0 && (
            <Flex gap="2" alignItems="center" wrap="wrap">
              {recommendations.map((url) => (
                <Button
                  key={url}
                  variant="ghost"
                  size="sm"
                  leftIcon={<RelayFavicon relay={url} size="xs" />}
                  isLoading={addRelay.loading}
                  onClick={() => addRelay.run(url)}
                >
                  <RelayName relay={url} />
                </Button>
              ))}
            </Flex>
          )}
        </>
      )}
    </Flex>
  );
}
