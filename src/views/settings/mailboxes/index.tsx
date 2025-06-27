import { Alert, AlertIcon, Flex, Heading, Link, Text } from "@chakra-ui/react";
import {
  AddInboxRelay,
  AddOutboxRelay,
  RemoveInboxRelay,
  RemoveOutboxRelay,
} from "applesauce-actions/actions/mailboxes";
import { useActionHub, useActiveAccount } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";

import DebugEventButton from "../../../components/debug-modal/debug-event-button";
import { InboxIcon, OutboxIcon } from "../../../components/icons";
import SimpleView from "../../../components/layout/presets/simple-view";
import RequireActiveAccount from "../../../components/router/require-active-account";
import useAsyncAction from "../../../hooks/use-async-action";
import { useRelayInfo } from "../../../hooks/use-relay-info";
import useReplaceableEvent from "../../../hooks/use-replaceable-event";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import AddRelayForm from "../relays/add-relay-form";
import RelayControl from "../relays/relay-control";

function InboxRelay({ url }: { url: string }) {
  const publish = usePublishEvent();
  const actions = useActionHub();
  const { info } = useRelayInfo(url);

  const remove = useAsyncAction(async () => {
    await actions.exec(RemoveInboxRelay, url).forEach((e) => publish("Remove inbox relay", e));
  });

  return (
    <RelayControl
      url={url}
      onRemove={remove.run}
      details={
        <>
          {info?.limitation?.restricted_writes && (
            <Text color="orange.500" fontSize="sm">
              Restricted writes: May cause issues with other users sending you notes
            </Text>
          )}
          {info?.limitation?.payment_required && (
            <Text color="red.500" fontSize="sm">
              Payment required: Paid relays dont make good inbox relays
            </Text>
          )}
        </>
      }
    />
  );
}

function OutboxRelay({ url }: { url: string }) {
  const publish = usePublishEvent();
  const actions = useActionHub();
  const { info } = useRelayInfo(url);

  const remove = useAsyncAction(async () => {
    await actions.exec(RemoveOutboxRelay, url).forEach((e) => publish("Remove outbox relay", e));
  });

  return <RelayControl url={url} onRemove={remove.run} />;
}

function MailboxesPage() {
  const account = useActiveAccount()!;
  const publish = usePublishEvent();
  const mailboxes = useUserMailboxes(account.pubkey);
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
        <Heading size="md">Inbox relays</Heading>
      </Flex>
      <Text fontStyle="italic" mt="-2">
        These relays are used by other users to send notes to you
      </Text>
      {(mailboxes?.inboxes?.length ?? 0) > 4 && (
        <Alert status="warning" variant="subtle" mt="2">
          <AlertIcon />
          Having too many inbox relays will make it difficult for other users to send you notes
        </Alert>
      )}
      {Array.from(mailboxes?.inboxes ?? [])
        .sort()
        .map((url) => (
          <InboxRelay key={url} url={url} />
        ))}
      <AddRelayForm onSubmit={addInboxRelay.run} />

      <Flex gap="2" mt="4">
        <OutboxIcon boxSize={5} />
        <Heading size="md">Outbox relays</Heading>
      </Flex>
      <Text fontStyle="italic" mt="-2">
        These relays are used to publish all your notes and events
      </Text>
      {(mailboxes?.outboxes?.length ?? 0) > 4 && (
        <Alert status="warning" variant="subtle" mt="2">
          <AlertIcon />
          Having too many outbox relays will make it difficult for other users to find your notes
        </Alert>
      )}
      {Array.from(mailboxes?.outboxes ?? [])
        .sort()
        .map((url) => (
          <OutboxRelay key={url} url={url} />
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
