import { Flex, Heading, IconButton, Link, Text } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";
import { kinds } from "nostr-tools";
import { useActionHub, useActiveAccount } from "applesauce-react/hooks";
import {
  AddInboxRelay,
  AddOutboxRelay,
  RemoveInboxRelay,
  RemoveOutboxRelay,
} from "applesauce-actions/actions/mailboxes";

import RequireActiveAccount from "../../../components/router/require-active-account";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
import { InboxIcon, OutboxIcon } from "../../../components/icons";
import MediaServerFavicon from "../../../components/favicon/media-server-favicon";
import { NostrEvent } from "nostr-tools";
import useAsyncAction from "../../../hooks/use-async-action";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import AddRelayForm from "../relays/add-relay-form";
import DebugEventButton from "../../../components/debug-modal/debug-event-button";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import SimpleView from "../../../components/layout/presets/simple-view";
import { RelayMode } from "../../../services/app-relays";

function RelayCard({ relay, mode, list }: { relay: string; mode: RelayMode; list?: NostrEvent }) {
  const publish = usePublishEvent();
  const actions = useActionHub();

  const remove = useAsyncAction(async () => {
    if (mode === RelayMode.READ) {
      await actions.exec(RemoveInboxRelay, relay).forEach((e) => publish("Remove inbox relay", e));
    } else if (mode === RelayMode.WRITE) {
      await actions.exec(RemoveOutboxRelay, relay).forEach((e) => publish("Remove outbox relay", e));
    }
  });

  return (
    <Flex key={relay} gap="2" alignItems="center" overflow="hidden">
      <MediaServerFavicon server={relay} size="xs" />
      <Link as={RouterLink} to={`/relays/${encodeURIComponent(relay)}`} isTruncated>
        {relay}
      </Link>
      <IconButton
        aria-label="Remove Relay"
        icon={<CloseIcon />}
        size="xs"
        ml="auto"
        colorScheme="red"
        variant="ghost"
        onClick={remove.run}
        isLoading={remove.loading}
      />
    </Flex>
  );
}

function MailboxesPage() {
  const account = useActiveAccount()!;
  const publish = usePublishEvent();
  const mailboxes = useUserMailboxes(account.pubkey, undefined, true);
  const event = useReplaceableEvent({ kind: kinds.RelayList, pubkey: account.pubkey });
  const actions = useActionHub();

  const addInboxRelay = useAsyncAction(async (relay: string) => {
    await actions.exec(AddInboxRelay, relay).forEach((e) => publish("Add inbox relay", e));
  });

  const addOutboxRelay = useAsyncAction(async (relay: string) => {
    await actions.exec(AddOutboxRelay, relay).forEach((e) => publish("Add outbox relay", e));
  });

  return (
    <SimpleView title="Mailboxes" actions={event && <DebugEventButton event={event} size="sm" ml="auto" />} maxW="4xl">
      <Text fontStyle="italic" mt="-2">
        Mailbox relays are a way for other users to find your events, or send you events. they are defined in{" "}
        <Link
          color="blue.500"
          isExternal
          href={`https://github.com/nostr-protocol/nips/blob/master/65.md`}
          textDecoration="underline"
        >
          NIP-65
        </Link>
      </Text>

      <Flex gap="2" mt="2">
        <InboxIcon boxSize={5} />
        <Heading size="md">Inbox</Heading>
      </Flex>
      <Text fontStyle="italic" mt="-2">
        These relays are used by other users to send DMs and notes to you
      </Text>
      {Array.from(mailboxes?.inboxes ?? [])
        .sort()
        .map((url) => (
          <RelayCard key={url} relay={url} mode={RelayMode.READ} list={event ?? undefined} />
        ))}
      <AddRelayForm onSubmit={addInboxRelay.run} />

      <Flex gap="2" mt="4">
        <OutboxIcon boxSize={5} />
        <Heading size="md">Outbox</Heading>
      </Flex>
      <Text fontStyle="italic" mt="-2">
        noStrudel will always publish to these relays so other users can find your notes
      </Text>
      {Array.from(mailboxes?.outboxes ?? [])
        .sort()
        .map((url) => (
          <RelayCard key={url} relay={url} mode={RelayMode.WRITE} list={event ?? undefined} />
        ))}
      <AddRelayForm onSubmit={addOutboxRelay.run} />
    </SimpleView>
  );
}

export default function MailboxesView() {
  return (
    <RequireActiveAccount>
      <MailboxesPage />
    </RequireActiveAccount>
  );
}
