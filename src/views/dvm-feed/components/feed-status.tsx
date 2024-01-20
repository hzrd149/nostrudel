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
  Heading,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import dayjs from "dayjs";

import {
  ChainedDVMJob,
  DVM_CONTENT_DISCOVERY_JOB_KIND,
  getJobStatusType,
  getResponseFromDVM,
} from "../../../helpers/nostr/dvm";
import { InlineInvoiceCard } from "../../../components/inline-invoice-card";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import { useSigningContext } from "../../../providers/global/signing-provider";
import { DraftNostrEvent } from "../../../types/nostr-event";
import clientRelaysService from "../../../services/client-relays";
import { useReadRelays } from "../../../hooks/use-client-relays";
import { DVMAvatarLink } from "./dvm-avatar";
import DVMLink from "./dvm-name";
import { AddressPointer } from "nostr-tools/lib/types/nip19";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
import RelaySet from "../../../classes/relay-set";

function NextPageButton({ chain, pointer }: { pointer: AddressPointer; chain: ChainedDVMJob[] }) {
  const toast = useToast();
  const { requestSignature } = useSigningContext();
  const dvmRelays = useUserMailboxes(pointer.pubkey)?.relays;
  const readRelays = useReadRelays();

  const lastJob = chain[chain.length - 1];
  const requestNextPage = async () => {
    try {
      const draft: DraftNostrEvent = {
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

      const signed = await requestSignature(draft);
      new NostrPublishAction("Next Page", RelaySet.from(clientRelaysService.outbox, dvmRelays), signed);
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
    }
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

export default function FeedStatus({ chain, pointer }: { chain: ChainedDVMJob[]; pointer: AddressPointer }) {
  const lastJob = chain[chain.length - 1];
  const response = lastJob.responses.find((r) => r.pubkey === pointer.pubkey);
  if (response?.result) return <NextPageButton pointer={pointer} chain={chain} />;

  const cardProps = { minW: "2xl", mx: "auto" };
  const cardHeader = (
    <CardHeader p="4" alignItems="center" display="flex" gap="2">
      <DVMAvatarLink pointer={pointer} w="12" />
      <DVMLink pointer={pointer} fontWeight="bold" fontSize="lg" />
    </CardHeader>
  );

  const statusEvent = response?.status;
  if (!statusEvent)
    return (
      <Card {...cardProps}>
        {cardHeader}
        <CardBody px="4" pb="4" pt="0" flexDirection="row" display="flex" alignItems="center" gap="4">
          <Spinner />
          <Heading size="sm">Waiting for response...</Heading>
        </CardBody>
      </Card>
    );

  const statusType = getJobStatusType(lastJob, pointer.pubkey);
  switch (statusType) {
    case "payment-required":
      const [_, msats, invoice] = statusEvent.tags.find((t) => t[0] === "amount") ?? [];

      return (
        <Card {...cardProps}>
          {cardHeader}
          <CardBody px="4" pb="4" pt="0" gap="2" display="flex" flexDirection="column">
            <Heading size="sm">{statusEvent.content}</Heading>
            {invoice && <InlineInvoiceCard paymentRequest={invoice} />}
          </CardBody>
        </Card>
      );
    case "processing":
      return (
        <Alert status="info" w="auto" {...cardProps}>
          <AlertIcon boxSize={8} />
          <Box>
            <AlertTitle>Processing</AlertTitle>
            <AlertDescription>{statusEvent.content}</AlertDescription>
          </Box>
        </Alert>
      );
    case "error":
      return (
        <Alert status="error" w="auto" {...cardProps}>
          <AlertIcon boxSize={8} />
          <Box>
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>{statusEvent.content}</AlertDescription>
          </Box>
        </Alert>
      );
    default:
      return (
        <>
          <Text>
            Unknown status <Code>{statusType}</Code>
          </Text>
          <Text>{statusEvent.content}</Text>
        </>
      );
  }
}
