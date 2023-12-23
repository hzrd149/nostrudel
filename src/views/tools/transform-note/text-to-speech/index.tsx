import { MouseEventHandler, useCallback, useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  Flex,
  IconButton,
  Select,
  Spacer,
  Spinner,
  Text,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import codes from "iso-language-codes";

import { useReadRelayUrls } from "../../../../hooks/use-client-relays";
import useTimelineLoader from "../../../../hooks/use-timeline-loader";
import { getEventUID } from "../../../../helpers/nostr/events";
import {
  DVMJob,
  DVMResponse,
  DVM_STATUS_KIND,
  DVM_TTS_JOB_KIND,
  DVM_TTS_RESULT_KIND,
  getRequestInputParam,
  groupEventsIntoJobs,
} from "../../../../helpers/nostr/dvm";
import useSubject from "../../../../hooks/use-subject";
import { DraftNostrEvent, NostrEvent } from "../../../../types/nostr-event";
import UserAvatarLink from "../../../../components/user-avatar-link";
import UserLink from "../../../../components/user-link";
import Timestamp from "../../../../components/timestamp";
import { CodeIcon, LightningIcon } from "../../../../components/icons";
import { readablizeSats } from "../../../../helpers/bolt11";
import { useSigningContext } from "../../../../providers/signing-provider";
import relayScoreboardService from "../../../../services/relay-scoreboard";
import NostrPublishAction from "../../../../classes/nostr-publish-action";
import clientRelaysService from "../../../../services/client-relays";
import useCurrentAccount from "../../../../hooks/use-current-account";
import { NostrQuery } from "../../../../types/nostr-query";
import NoteDebugModal from "../../../../components/debug-modals/note-debug-modal";

function getTranslationRequestLanguage(request: NostrEvent) {
  const targetLanguage = getRequestInputParam(request, "language", false);
  return codes.find((code) => code.iso639_1 === targetLanguage);
}

function TextToSpeechJob({ job }: { job: DVMJob }) {
  const lang = getTranslationRequestLanguage(job.request);
  const debug = useDisclosure();

  return (
    <>
      <Card variant="outline">
        <CardHeader px="4" py="4" pb="2" display="flex" gap="2" alignItems="center" flexWrap="wrap">
          <UserAvatarLink pubkey={job.request.pubkey} size="sm" />
          <UserLink pubkey={job.request.pubkey} fontWeight="bold" />
          <Text>
            Requested reading in <strong>{lang?.nativeName}</strong>
          </Text>
          <Timestamp timestamp={job.request.created_at} />
          <Spacer />
          <IconButton
            icon={<CodeIcon />}
            aria-label="Show Raw"
            title="Show Raw"
            variant="ghost"
            size="sm"
            onClick={debug.onOpen}
          />
        </CardHeader>
        {job.responses.length === 0 && (
          <Flex gap="2" alignItems="center" m="4">
            <Spinner />
            Waiting for response
          </Flex>
        )}
        {Object.values(job.responses).map((response) => (
          <TextToSpeechResponse key={response.pubkey} response={response} />
        ))}
      </Card>
      {debug.isOpen && <NoteDebugModal isOpen onClose={debug.onClose} event={job.request} />}
    </>
  );
}

function TextToSpeechResponse({ response }: { response: DVMResponse }) {
  if (response.result) return <TextToSpeechResult result={response.result} />;
  if (response.status) return <TextToSpeechStatus status={response.status} />;
  return null;
}

function TextToSpeechStatus({ status }: { status: NostrEvent }) {
  const toast = useToast();

  const amountTag = status.tags.find((t) => t[0] === "amount" && t[1] && t[2]);
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
    <>
      <Flex gap="2" alignItems="center" grow={1}>
        <UserAvatarLink pubkey={status.pubkey} size="sm" />
        <UserLink pubkey={status.pubkey} fontWeight="bold" />
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
      </Flex>
      <Text>{status.content}</Text>
    </>
  );
}

function TextToSpeechResult({ result }: { result: NostrEvent }) {
  return (
    <>
      <Flex gap="2" alignItems="center" grow={1}>
        <UserAvatarLink pubkey={result.pubkey} size="sm" />
        <UserLink pubkey={result.pubkey} fontWeight="bold" />
        <Text>Finished job</Text>
      </Flex>
      <Text>{result.content}</Text>
    </>
  );
}

export default function NoteTextToSpeechPage({ note }: { note: NostrEvent }) {
  const { requestSignature } = useSigningContext();
  const toast = useToast();
  const account = useCurrentAccount();

  const [lang, setLang] = useState(navigator.language.split("-")[0] ?? "en");
  const readRelays = useReadRelayUrls();
  const requestReading = useCallback(async () => {
    try {
      const top8Relays = relayScoreboardService.getRankedRelays(readRelays).slice(0, 8);
      const draft: DraftNostrEvent = {
        kind: DVM_TTS_JOB_KIND,
        content: "",
        created_at: dayjs().unix(),
        tags: [
          ["i", note.id, "event"],
          ["param", "language", lang],
          ["relays", ...top8Relays],
        ],
      };

      const signed = await requestSignature(draft);
      new NostrPublishAction("Request Reading", clientRelaysService.getWriteUrls(), signed);
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
    }
  }, [requestSignature, note, readRelays]);

  const timeline = useTimelineLoader(
    `${getEventUID(note)}-readings`,
    readRelays,
    [
      {
        kinds: [DVM_TTS_JOB_KIND, DVM_TTS_RESULT_KIND],
        "#i": [note.id],
      },
      account && { kinds: [DVM_STATUS_KIND], "#p": [account.pubkey] },
    ].filter(Boolean) as NostrQuery[],
  );

  const events = useSubject(timeline.timeline);
  const jobs = groupEventsIntoJobs(events);

  return (
    <>
      <Flex gap="2">
        <Select value={lang} onChange={(e) => setLang(e.target.value)} w="60">
          {codes.map((code) => (
            <option key={code.iso639_1} value={code.iso639_1}>
              {code.name} ({code.nativeName})
            </option>
          ))}
        </Select>
        <Button size="md" variant="solid" colorScheme="primary" onClick={requestReading} flexShrink={0}>
          Request new reading
        </Button>
      </Flex>
      {Array.from(Object.values(jobs)).map((job) => (
        <TextToSpeechJob key={job.request.id} job={job} />
      ))}
    </>
  );
}
