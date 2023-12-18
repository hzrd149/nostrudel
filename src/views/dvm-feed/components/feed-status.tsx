import { Button, Card, CardBody, CardHeader, Code, Heading, Spinner, Text, useToast } from "@chakra-ui/react";
import dayjs from "dayjs";

import { ChainedDVMJob, DMV_CONTENT_DISCOVERY_JOB_KIND, getJobStatusType } from "../../../helpers/nostr/dvm";
import { InlineInvoiceCard } from "../../../components/inline-invoice-card";
import NostrPublishAction from "../../../classes/nostr-publish-action";
import { useSigningContext } from "../../../providers/signing-provider";
import { DraftNostrEvent } from "../../../types/nostr-event";
import { unique } from "../../../helpers/array";
import clientRelaysService from "../../../services/client-relays";
import { useUserRelays } from "../../../hooks/use-user-relays";
import { useReadRelayUrls } from "../../../hooks/use-client-relays";
import { RelayMode } from "../../../classes/relay";
import { DVMAvatarLink } from "./dvm-avatar";
import DVMLink from "./dvm-name";
import { AddressPointer } from "nostr-tools/lib/types/nip19";

function NextPageButton({ pointer, chain }: { pointer: AddressPointer; chain: ChainedDVMJob[] }) {
  const toast = useToast();
  const { requestSignature } = useSigningContext();
  const dvmRelays = useUserRelays(pointer.pubkey)
    .filter((r) => r.mode & RelayMode.READ)
    .map((r) => r.url);
  const readRelays = useReadRelayUrls();

  const lastJob = chain[chain.length - 1];
  const requestNextPage = async () => {
    try {
      const draft: DraftNostrEvent = {
        kind: DMV_CONTENT_DISCOVERY_JOB_KIND,
        created_at: dayjs().unix(),
        content: "",
        tags: [
          ["i", lastJob.request.id, "event"],
          ["p", pointer.pubkey],
          ["relays", ...readRelays],
          ["output", "text/plain"],
        ],
      };

      const signed = await requestSignature(draft);
      new NostrPublishAction("Next Page", unique([...clientRelaysService.getWriteUrls(), ...dvmRelays]), signed);
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
    }
  };

  return (
    <Button
      colorScheme="primary"
      onClick={requestNextPage}
      isLoading={lastJob && !lastJob.result && !lastJob.status}
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
  if (lastJob.result) return <NextPageButton pointer={pointer} chain={chain} />;

  const cardProps = { minW: "2xl", mx: "auto" };
  const cardHeader = (
    <CardHeader p="4" alignItems="center" display="flex" gap="2">
      <DVMAvatarLink pointer={pointer} w="12" />
      <DVMLink pointer={pointer} fontWeight="bold" fontSize="lg" />
    </CardHeader>
  );

  const statusEvent = lastJob.status;
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

  const statusType = getJobStatusType(lastJob);
  switch (statusType) {
    case "payment-required":
      const [_, msats, invoice] = statusEvent.tags.find((t) => t[0] === "amount") ?? [];

      return (
        <Card {...cardProps}>
          {cardHeader}
          <CardBody px="4" pb="4" pt="0">
            <Heading size="md">{statusEvent.content}</Heading>
            {invoice && <InlineInvoiceCard paymentRequest={invoice} />}
          </CardBody>
        </Card>
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
