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
  useToast,
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
import NostrPublishAction from "../../classes/nostr-publish-action";
import clientRelaysService from "../../services/client-relays";
import { useSigningContext } from "../../providers/global/signing-provider";
import { useForm } from "react-hook-form";
import { safeRelayUrl } from "../../helpers/relay";
import replaceableEventLoaderService from "../../services/replaceable-event-requester";

function RelayLine({ relay, mode, list }: { relay: string; mode: RelayMode; list?: NostrEvent }) {
  const { requestSignature } = useSigningContext();
  const remove = useAsyncErrorHandler(async () => {
    const draft = removeRelayModeFromMailbox(list, relay, mode);
    const signed = await requestSignature(draft);
    new NostrPublishAction("Remove relay", clientRelaysService.outbox.urls, signed);
  }, [relay, mode, list, requestSignature]);

  return (
    <Flex key={relay} gap="2" alignItems="center">
      <RelayFavicon relay={relay} size="xs" />
      <Link as={RouterLink} to={`/r/${encodeURIComponent(relay)}`}>
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
  const toast = useToast();
  const account = useCurrentAccount()!;
  const { inbox, outbox, event } = useUserMailboxes(account.pubkey) || {};

  const { requestSignature } = useSigningContext();
  const addRelay = useCallback(
    async (relay: string, mode: RelayMode) => {
      try {
        const draft = addRelayModeToMailbox(event ?? undefined, relay, mode);
        const signed = await requestSignature(draft);
        replaceableEventLoaderService.handleEvent(signed);
      } catch (e) {
        if (e instanceof Error) toast({ status: "error", description: e.message });
      }
    },
    [event, requestSignature],
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
