import { useCallback, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Select,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import codes from "iso-language-codes";

import { DraftNostrEvent, NostrEvent, isETag, isPTag } from "../../types/nostr-event";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { getEventUID } from "../../helpers/nostr/events";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useSubject from "../../hooks/use-subject";
import UserAvatarLink from "../user-avatar-link";
import { UserLink } from "../user-link";
import { useSigningContext } from "../../providers/signing-provider";
import relayScoreboardService from "../../services/relay-scoreboard";
import NostrPublishAction from "../../classes/nostr-publish-action";
import clientRelaysService from "../../services/client-relays";
import { NoteContents } from "../note/text-note-contents";
import Timestamp from "../timestamp";
import { readablizeSats } from "../../helpers/bolt11";
import { LightningIcon } from "../icons";
import { DMV_STATUS_KIND, DMV_TRANSLATE_JOB_KIND, DMV_TRANSLATE_RESULT_KIND } from "../../helpers/nostr/dvm";

function TranslationResult({ result }: { result: NostrEvent }) {
  const requester = result.tags.find(isPTag)?.[1];

  return (
    <Card variant="outline">
      <CardHeader px="4" py="4" pb="2" display="flex" gap="2" alignItems="center">
        <UserAvatarLink pubkey={result.pubkey} size="sm" />
        <UserLink pubkey={result.pubkey} fontWeight="bold" />
        <Timestamp timestamp={result.created_at} />
      </CardHeader>
      <CardBody px="4" pt="0" pb="4">
        {requester && (
          <Text fontStyle="italic" mb="2">
            Requested by <UserLink pubkey={requester} fontWeight="bold" />
          </Text>
        )}
        <NoteContents event={result} />
      </CardBody>
    </Card>
  );
}

function TranslationRequest({ request }: { request: NostrEvent }) {
  const targetLanguage = request.tags.find((t) => t[0] === "param" && t[1] === "language")?.[2];
  const lang = codes.find((code) => code.iso639_1 === targetLanguage);
  const requestRelays = request.tags.find((t) => t[0] === "relays")?.slice(1);
  const readRelays = useReadRelayUrls();

  const timeline = useTimelineLoader(`${getEventUID(request)}-offers`, requestRelays || readRelays, {
    kinds: [DMV_STATUS_KIND],
    "#e": [request.id],
  });

  const offers = useSubject(timeline.timeline);

  return (
    <Card variant="outline">
      <CardHeader px="4" py="4" pb="2" display="flex" gap="2" alignItems="center" flexWrap="wrap">
        <UserAvatarLink pubkey={request.pubkey} size="sm" />
        <UserLink pubkey={request.pubkey} fontWeight="bold" />
        <Text>Requested translation to {lang?.nativeName}</Text>
        <Timestamp timestamp={request.created_at} />
      </CardHeader>
      <CardBody px="4" pt="0" pb="4">
        {offers.length === 0 ? (
          <Flex gap="2" alignItems="center">
            <Spinner />
            Waiting for offers
          </Flex>
        ) : (
          <Heading size="md" mb="2">
            Offers ({offers.length})
          </Heading>
        )}
        {offers.map((offer) => (
          <TranslationOffer key={offer.id} offer={offer} />
        ))}
      </CardBody>
    </Card>
  );
}

function TranslationOffer({ offer }: { offer: NostrEvent }) {
  const toast = useToast();

  const amountTag = offer.tags.find((t) => t[0] === "amount" && t[1] && t[2]);
  const amountMsat = amountTag?.[1] && parseInt(amountTag[1]);
  const invoice = amountTag?.[2];

  const [paid, setPaid] = useState(false);
  const [paying, setPaying] = useState(false);
  const payInvoice = async () => {
    try {
      if (window.webln && invoice) {
        setPaying(true);
        await window.webln.sendPayment(invoice);
        setPaid(true);
      }
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
    }
    setPaying(false);
  };

  return (
    <Flex gap="2" direction="column">
      <Flex gap="2" alignItems="center">
        <UserAvatarLink pubkey={offer.pubkey} size="sm" />
        <UserLink pubkey={offer.pubkey} fontWeight="bold" />

        {invoice && amountMsat && (
          <Button
            colorScheme="yellow"
            ml="auto"
            size="sm"
            leftIcon={<LightningIcon />}
            onClick={payInvoice}
            isLoading={paying || paid}
            isDisabled={!window.webln}
          >
            Pay {readablizeSats(amountMsat / 1000)} sats
          </Button>
        )}
      </Flex>
      <Text>{offer.content}</Text>
    </Flex>
  );
}

export default function NoteTranslationModal({
  onClose,
  isOpen,
  note,
  ...props
}: Omit<ModalProps, "children"> & { note: NostrEvent }) {
  const { requestSignature } = useSigningContext();
  const toast = useToast();

  const [lang, setLang] = useState(navigator.language.split("-")[0] ?? "en");
  const readRelays = useReadRelayUrls();
  const requestTranslation = useCallback(async () => {
    try {
      const top8Relays = relayScoreboardService.getRankedRelays(readRelays).slice(0, 8);
      const draft: DraftNostrEvent = {
        kind: DMV_TRANSLATE_JOB_KIND,
        content: "",
        created_at: dayjs().unix(),
        tags: [
          ["i", note.id, "event"],
          ["param", "language", lang],
          ["output", "text/plain"],
          ["relays", ...top8Relays],
        ],
      };

      const signed = await requestSignature(draft);
      new NostrPublishAction("Request Translation", clientRelaysService.getWriteUrls(), signed);
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
    }
  }, [requestSignature, note, readRelays]);

  const timeline = useTimelineLoader(`${getEventUID(note)}-translations`, readRelays, {
    kinds: [DMV_TRANSLATE_JOB_KIND, DMV_TRANSLATE_RESULT_KIND],
    "#i": [note.id],
  });

  const events = useSubject(timeline.timeline);
  const filteredEvents = events.filter(
    (e, i, arr) =>
      e.kind === DMV_TRANSLATE_RESULT_KIND ||
      (e.kind === DMV_TRANSLATE_JOB_KIND && !arr.some((r) => r.tags.some((t) => isETag(t) && t[1] === e.id))),
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader p="4">Note Translations</ModalHeader>
        <ModalCloseButton />
        <ModalBody px="4" pt="0" pb="4" display="flex" gap="2" flexDirection="column">
          <Flex gap="2">
            <Select value={lang} onChange={(e) => setLang(e.target.value)} w="60">
              {codes.map((code) => (
                <option value={code.iso639_1}>
                  {code.name} ({code.nativeName})
                </option>
              ))}
            </Select>
            <Button colorScheme="primary" onClick={requestTranslation} flexShrink={0}>
              Request new translation
            </Button>
          </Flex>
          {filteredEvents.map((event) => {
            switch (event.kind) {
              case DMV_TRANSLATE_JOB_KIND:
                return <TranslationRequest key={event.id} request={event} />;
              case DMV_TRANSLATE_RESULT_KIND:
                return <TranslationResult key={event.id} result={event} />;
            }
          })}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
