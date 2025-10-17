import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Code,
  Flex,
  Heading,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { getTagValue } from "applesauce-core/helpers";
import dayjs from "dayjs";
import { EventTemplate, NostrEvent } from "nostr-tools";
import { AddressPointer } from "nostr-tools/nip19";

import DebugEventButton from "../../../../components/debug-modal/debug-event-button";
import InlineInvoiceCard from "../../../../components/lightning/inline-invoice-card";
import UserAvatar from "../../../../components/user/user-avatar";
import UserDnsIdentity from "../../../../components/user/user-dns-identity";
import UserLink from "../../../../components/user/user-link";
import EventZapButton from "../../../../components/zap/event-zap-button";
import { ChainedDVMJob, DVM_CONTENT_DISCOVERY_JOB_KIND, getResponseFromDVM } from "../../../../helpers/nostr/dvm";
import { useReadRelays } from "../../../../hooks/use-client-relays";
import useUserMailboxes from "../../../../hooks/use-user-mailboxes";
import { usePublishEvent } from "../../../../providers/global/publish-provider";
import { DVMAvatarLink } from "./dvm-avatar";
import DVMLink from "./dvm-name";

function NextPageButton({ chain, pointer }: { pointer: AddressPointer; chain: ChainedDVMJob[] }) {
  const publish = usePublishEvent();
  const dvmRelays = useUserMailboxes(pointer.pubkey);
  const readRelays = useReadRelays();

  const lastJob = chain[chain.length - 1];
  const requestNextPage = async () => {
    const draft: EventTemplate = {
      kind: DVM_CONTENT_DISCOVERY_JOB_KIND,
      created_at: dayjs().unix(),
      content: "",
      tags: [
        ["i", lastJob.request.id, "event"],
        ["p", pointer.pubkey],
        ["relays", ...readRelays],
        ["expiration", String(dayjs().add(1, "day").unix())],
      ],
    };

    await publish("Next Page", draft, dvmRelays?.inboxes);
  };

  const response = getResponseFromDVM(lastJob, pointer.pubkey);

  return (
    <Button
      colorScheme="primary"
      onClick={requestNextPage}
      isLoading={lastJob && !response?.result && !response?.status}
      mx="auto"
      my="4"
      px="20"
    >
      Next page
    </Button>
  );
}

export function DVMStatusCard({ status, pointer }: { status?: NostrEvent; pointer?: AddressPointer }) {
  const cardProps = { w: "full", maxW: "2xl", mx: "auto", overflow: "hidden" };
  const cardHeader = (
    <CardHeader p="4" alignItems="center" display="flex" gap="2">
      {pointer ? (
        <>
          <DVMAvatarLink pointer={pointer} w="12" />
          <DVMLink pointer={pointer} fontWeight="bold" fontSize="lg" />
        </>
      ) : (
        status && (
          <>
            <UserAvatar pubkey={status.pubkey} size="md" />
            <Flex direction="column">
              <UserLink pubkey={status.pubkey} fontWeight="bold" fontSize="lg" />
              <UserDnsIdentity pubkey={status.pubkey} />
            </Flex>
          </>
        )
      )}
      {status && <DebugEventButton ml="auto" event={status} size="sm" variant="ghost" />}
    </CardHeader>
  );

  if (!status)
    return (
      <Card {...cardProps}>
        {cardHeader}
        <CardBody px="4" pb="4" pt="0" flexDirection="row" display="flex" alignItems="center" gap="4">
          <Spinner />
          <Heading size="sm">Waiting for response...</Heading>
        </CardBody>
      </Card>
    );

  const statusType = getTagValue(status, "status");
  switch (statusType) {
    case "payment-required":
      const [_, _msats, invoice] = status.tags.find((t) => t[0] === "amount") ?? [];

      return (
        <Card {...cardProps}>
          {cardHeader}
          <CardBody px="4" pb="4" pt="0" gap="2" display="flex" flexDirection="column">
            <Heading size="sm">{status.content}</Heading>
            {invoice ? (
              <InlineInvoiceCard paymentRequest={invoice} />
            ) : (
              <EventZapButton event={status} showEventPreview={false} allowComment={false} />
            )}
          </CardBody>
        </Card>
      );
    case "processing":
      return (
        <Alert status="info" {...cardProps}>
          <AlertIcon boxSize={8} />
          <Box>
            <AlertTitle>Processing</AlertTitle>
            <AlertDescription>{status.content}</AlertDescription>
          </Box>
        </Alert>
      );
    case "error":
      return (
        <Alert status="error" {...cardProps}>
          <AlertIcon boxSize={8} />
          <Box>
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>{status.content}</AlertDescription>
          </Box>
        </Alert>
      );
    default:
      return (
        <>
          <Text>
            Unknown status <Code>{statusType}</Code>
          </Text>
          <Text>{status.content}</Text>
        </>
      );
  }
}

export default function FeedStatus({ chain, pointer }: { chain: ChainedDVMJob[]; pointer: AddressPointer }) {
  const lastJob = chain[chain.length - 1];
  const response = lastJob.responses.find((r) => r.pubkey === pointer.pubkey);
  if (response?.result) return <NextPageButton pointer={pointer} chain={chain} />;

  return <DVMStatusCard status={response?.status} pointer={pointer} />;
}
