import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  Heading,
  IconButton,
  Link,
  Text,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";

import VerticalPageLayout from "../../components/vertical-page-layout";
import RequireCurrentAccount from "../../providers/route/require-current-account";
import useUserMailboxes from "../../hooks/use-user-mailboxes";
import useCurrentAccount from "../../hooks/use-current-account";
import { InboxIcon } from "../../components/icons";
import { RelayUrlInput } from "../../components/relay-url-input";
import { RelayFavicon } from "../../components/relay-favicon";
import { RelayMode } from "../../classes/relay";
import { useCallback } from "react";
import { NostrEvent } from "../../types/nostr-event";
import { addRelayModeToMailbox, removeRelayModeFromMailbox } from "../../helpers/nostr/mailbox";
import useAsyncErrorHandler from "../../hooks/use-async-error-handler";
import { useForm } from "react-hook-form";
import { safeRelayUrl } from "../../helpers/relay";
import { usePublishEvent } from "../../providers/global/publish-provider";
import { COMMON_CONTACT_RELAY } from "../../const";

function RelayLine({ relay, mode, list }: { relay: string; mode: RelayMode; list?: NostrEvent }) {
  const publish = usePublishEvent();
  const remove = useAsyncErrorHandler(async () => {
    const draft = removeRelayModeFromMailbox(list, relay, mode);
    await publish("Remove relay", draft, [COMMON_CONTACT_RELAY]);
  }, [relay, mode, list, publish]);

  return (
    <Flex key={relay} gap="2" alignItems="center" overflow="hidden">
      <RelayFavicon relay={relay} size="xs" />
      <Link as={RouterLink} to={`/r/${encodeURIComponent(relay)}`} isTruncated>
        {relay}
      </Link>
      <IconButton
        aria-label="Remove Relay"
        icon={<CloseIcon />}
        size="xs"
        ml="auto"
        colorScheme="red"
        variant="ghost"
        onClick={remove}
      />
    </Flex>
  );
}

function AddRelayForm({ onSubmit }: { onSubmit: (url: string) => void }) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      url: "",
    },
  });

  const submit = handleSubmit(async (values) => {
    const url = safeRelayUrl(values.url);
    if (!url) return;
    await onSubmit(url);
    reset();
  });

  return (
    <Flex as="form" display="flex" gap="2" onSubmit={submit} flex={1}>
      <RelayUrlInput {...register("url")} placeholder="wss://relay.example.com" size="sm" borderRadius="md" />
      <Button type="submit" colorScheme="primary" size="sm">
        Add
      </Button>
    </Flex>
  );
}

function MailboxesPage() {
  const account = useCurrentAccount()!;
  const publish = usePublishEvent();
  const { inbox, outbox, event } = useUserMailboxes(account.pubkey, { alwaysRequest: true, ignoreCache: true }) || {};

  const addRelay = useCallback(
    async (relay: string, mode: RelayMode) => {
      const draft = addRelayModeToMailbox(event ?? undefined, relay, mode);
      await publish("Add Relay", draft, [COMMON_CONTACT_RELAY]);
    },
    [event],
  );

  return (
    <VerticalPageLayout>
      <Heading>Mailboxes</Heading>
      <Card maxW="lg">
        <CardHeader p="4" pb="2" display="flex" gap="2" alignItems="center">
          <InboxIcon boxSize={5} />
          <Heading size="md">Inbox</Heading>
        </CardHeader>
        <CardBody px="4" py="0" display="flex" flexDirection="column" gap="2">
          <Text fontStyle="italic">Other users will send DMs and notes to these relays to notify you</Text>
          {inbox?.urls
            .sort()
            .map((url) => <RelayLine key={url} relay={url} mode={RelayMode.READ} list={event ?? undefined} />)}
        </CardBody>
        <CardFooter display="flex" gap="2" p="4">
          <AddRelayForm onSubmit={(r) => addRelay(r, RelayMode.READ)} />
        </CardFooter>
      </Card>
      <Card maxW="lg">
        <CardHeader p="4" pb="2" display="flex" gap="2" alignItems="center">
          <InboxIcon boxSize={5} />
          <Heading size="md">Outbox</Heading>
        </CardHeader>
        <CardBody px="4" py="0" display="flex" flexDirection="column" gap="1">
          <Text fontStyle="italic">Always publish to these relays so your followers can find your notes</Text>
          {outbox?.urls
            .sort()
            .map((url) => <RelayLine key={url} relay={url} mode={RelayMode.WRITE} list={event ?? undefined} />)}
        </CardBody>
        <CardFooter display="flex" gap="2" p="4">
          <AddRelayForm onSubmit={(r) => addRelay(r, RelayMode.WRITE)} />
        </CardFooter>
      </Card>
    </VerticalPageLayout>
  );
}

export default function MailboxesView() {
  return (
    <RequireCurrentAccount>
      <MailboxesPage />
    </RequireCurrentAccount>
  );
}
