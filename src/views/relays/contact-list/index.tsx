import { Button, Code, Flex, Heading, Link, Spinner, Text } from "@chakra-ui/react";
import BackButton from "../../../components/router/back-button";
import useCurrentAccount from "../../../hooks/use-current-account";
import { Link as RouterLink } from "react-router-dom";

import { RelayFavicon } from "../../../components/relay-favicon";
import useUserContactRelays from "../../../hooks/use-user-contact-relays";
import { CheckIcon, InboxIcon, OutboxIcon } from "../../../components/icons";
import { useCallback, useState } from "react";
import useCacheForm from "../../../hooks/use-cache-form";
import useUserContactList from "../../../hooks/use-user-contact-list";
import { cloneEvent } from "../../../helpers/nostr/event";
import { EventTemplate } from "nostr-tools";
import dayjs from "dayjs";
import { usePublishEvent } from "../../../providers/global/publish-provider";

function RelayItem({ url }: { url: string }) {
  return (
    <Flex gap="2" alignItems="center">
      <RelayFavicon relay={url} size="sm" />
      <Link as={RouterLink} to={`/r/${encodeURIComponent(url)}`} isTruncated>
        {url}
      </Link>
    </Flex>
  );
}

export default function ContactListRelaysView() {
  const account = useCurrentAccount();
  const contacts = useUserContactList(account?.pubkey);
  const relays = useUserContactRelays(account?.pubkey);
  const publish = usePublishEvent();

  const [loading, setLoading] = useState(false);
  const clearRelays = useCallback(async () => {
    if (!contacts) return;
    if (confirm("Are you use you want to remove these relays? Other nostr apps might be effected") !== true) return;

    const draft: EventTemplate = {
      kind: contacts.kind,
      content: "",
      tags: contacts.tags,
      created_at: dayjs().unix(),
    };

    setLoading(true);
    await publish("Clear Relays", draft);
    setLoading(false);
  }, [setLoading, contacts, publish]);

  if (relays === undefined) return <Spinner />;

  return (
    <Flex gap="2" direction="column" overflow="auto hidden" flex={1} px={{ base: "2", lg: 0 }}>
      <Flex gap="2" alignItems="center">
        <BackButton hideFrom="lg" size="sm" />
        <Heading size="lg">Contact List Relays</Heading>
        {relays && (
          <Button
            colorScheme="red"
            onClick={clearRelays}
            isLoading={loading}
            ml="auto"
            size="sm"
            isDisabled={account?.readonly}
          >
            Clear Relays
          </Button>
        )}
      </Flex>

      <Text fontStyle="italic" mt="-2">
        Some apps store relays in your contacts list (kind-3)
        <br />
        noStrudel does not use these relays, instead it uses your{" "}
        <Link as={RouterLink} to="/relays/mailboxes" color="blue.500">
          Mailbox Relays
        </Link>
      </Text>

      {relays === null ? (
        <Text color="green.500" fontSize="lg" mt="4">
          <CheckIcon /> You don't have any relays stored in your contact list
        </Text>
      ) : (
        <>
          <Heading size="md" mt="2">
            Read Relays
          </Heading>
          {relays.inbox.urls.map((relay) => (
            <Flex key={relay} gap="2" alignItems="center" overflow="hidden">
              <RelayFavicon relay={relay} size="xs" />
              <Link as={RouterLink} to={`/r/${encodeURIComponent(relay)}`} isTruncated>
                {relay}
              </Link>
            </Flex>
          ))}

          <Heading size="md" mt="2">
            Write Relays
          </Heading>
          {relays.outbox.urls.map((relay) => (
            <Flex key={relay} gap="2" alignItems="center" overflow="hidden">
              <RelayFavicon relay={relay} size="xs" />
              <Link as={RouterLink} to={`/r/${encodeURIComponent(relay)}`} isTruncated>
                {relay}
              </Link>
            </Flex>
          ))}
        </>
      )}
    </Flex>
  );
}
