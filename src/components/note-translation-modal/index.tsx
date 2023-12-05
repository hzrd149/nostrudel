import { MouseEventHandler, useCallback, useState } from "react";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Button,
  Card,
  CardHeader,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Select,
  Spacer,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import codes from "iso-language-codes";

import { DraftNostrEvent, NostrEvent } from "../../types/nostr-event";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { getEventUID } from "../../helpers/nostr/events";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useSubject from "../../hooks/use-subject";
import UserAvatarLink from "../user-avatar-link";
import UserLink from "../user-link";
import { useSigningContext } from "../../providers/signing-provider";
import relayScoreboardService from "../../services/relay-scoreboard";
import NostrPublishAction from "../../classes/nostr-publish-action";
import clientRelaysService from "../../services/client-relays";
import { NoteContents } from "../note/text-note-contents";
import Timestamp from "../timestamp";
import { readablizeSats } from "../../helpers/bolt11";
import { LightningIcon } from "../icons";
import { DMV_STATUS_KIND, DMV_TRANSLATE_JOB_KIND, DMV_TRANSLATE_RESULT_KIND } from "../../helpers/nostr/dvm";

function getTranslationRequestLanguage(request: NostrEvent) {
  const targetLanguage = request.tags.find((t) => t[0] === "param" && t[1] === "language")?.[2];
  return codes.find((code) => code.iso639_1 === targetLanguage);
}

function TranslationRequest({ request }: { request: NostrEvent }) {
  const lang = getTranslationRequestLanguage(request);
  const requestRelays = request.tags.find((t) => t[0] === "relays")?.slice(1);
  const readRelays = useReadRelayUrls();

  const timeline = useTimelineLoader(`${getEventUID(request)}-offers-results`, requestRelays || readRelays, {
    kinds: [DMV_STATUS_KIND, DMV_TRANSLATE_RESULT_KIND],
    "#e": [request.id],
  });

  const events = useSubject(timeline.timeline);
  const dvmStatuses: Record<string, NostrEvent> = {};
  for (const event of events) {
    if (
      (event.kind === DMV_STATUS_KIND || event.kind === DMV_TRANSLATE_RESULT_KIND) &&
      (!dvmStatuses[event.pubkey] || dvmStatuses[event.pubkey].created_at < event.created_at)
    ) {
      dvmStatuses[event.pubkey] = event;
    }
  }

  return (
    <Card variant="outline">
      <CardHeader px="4" py="4" pb="2" display="flex" gap="2" alignItems="center" flexWrap="wrap">
        <UserAvatarLink pubkey={request.pubkey} size="sm" />
        <UserLink pubkey={request.pubkey} fontWeight="bold" />
        <Text>
          Requested translation to <strong>{lang?.nativeName}</strong>
        </Text>
        <Timestamp timestamp={request.created_at} />
      </CardHeader>
      {Object.keys(dvmStatuses).length === 0 && (
        <Flex gap="2" alignItems="center" m="4">
          <Spinner />
          Waiting for offers
        </Flex>
      )}
      <Accordion allowMultiple>
        {Object.values(dvmStatuses).map((event) => {
          switch (event.kind) {
            case DMV_STATUS_KIND:
              return <TranslationOffer key={event.id} offer={event} />;
            case DMV_TRANSLATE_RESULT_KIND:
              return <TranslationResult key={event.id} result={event} />;
          }
        })}
      </Accordion>
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
  const payInvoice: MouseEventHandler = async (e) => {
    try {
      if (window.webln && invoice) {
        setPaying(true);
        e.stopPropagation();
        await window.webln.sendPayment(invoice);
        setPaid(true);
      }
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
    }
    setPaying(false);
  };

  return (
    <AccordionItem>
      <AccordionButton>
        <Flex gap="2" alignItems="center" grow={1}>
          <UserAvatarLink pubkey={offer.pubkey} size="sm" />
          <UserLink pubkey={offer.pubkey} fontWeight="bold" />
          <Text>Offered</Text>
          <Spacer />

          {invoice && amountMsat && (
            <Button
              colorScheme="yellow"
              size="sm"
              variant="solid"
              leftIcon={<LightningIcon />}
              onClick={payInvoice}
              isLoading={paying || paid}
              isDisabled={!window.webln}
            >
              Pay {readablizeSats(amountMsat / 1000)} sats
            </Button>
          )}
          <AccordionIcon />
        </Flex>
      </AccordionButton>
      <AccordionPanel pb={4}>
        <Text>{offer.content}</Text>
      </AccordionPanel>
    </AccordionItem>
  );
}

function TranslationResult({ result }: { result: NostrEvent }) {
  return (
    <AccordionItem>
      <AccordionButton>
        <Flex gap="2" alignItems="center" grow={1}>
          <UserAvatarLink pubkey={result.pubkey} size="sm" />
          <UserLink pubkey={result.pubkey} fontWeight="bold" />
          <Text>Translated Note</Text>
          <AccordionIcon ml="auto" />
        </Flex>
      </AccordionButton>
      <AccordionPanel pb={4}>
        <NoteContents event={result} />
      </AccordionPanel>
    </AccordionItem>
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
    kinds: [DMV_TRANSLATE_JOB_KIND],
    "#i": [note.id],
  });

  const events = useSubject(timeline.timeline);
  const jobs = events.filter((e) => e.kind === DMV_TRANSLATE_JOB_KIND);

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
            <Button size="md" variant="solid" colorScheme="primary" onClick={requestTranslation} flexShrink={0}>
              Request new translation
            </Button>
          </Flex>
          {jobs.map((event) => (
            <TranslationRequest key={event.id} request={event} />
          ))}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
