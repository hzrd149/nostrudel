import { Card, CardBody, CardHeader, Flex, IconButton, Spacer, Spinner, Text, useDisclosure } from "@chakra-ui/react";
import codes from "iso-language-codes";

import { DVMJob, getRequestInputParam } from "../../../../helpers/nostr/dvm";
import { NostrEvent } from "nostr-tools";
import UserAvatarLink from "../../../../components/user/user-avatar-link";
import UserLink from "../../../../components/user/user-link";
import Timestamp from "../../../../components/timestamp";
import { CodeIcon } from "../../../../components/icons";
import TextToSpeechResponse from "./tts-response";
import EventDebugModal from "../../../../components/debug-modal/event-debug-modal";

function getTranslationRequestLanguage(request: NostrEvent) {
  const targetLanguage = getRequestInputParam(request, "language", false);
  return codes.find((code) => code.iso639_1 === targetLanguage);
}

export default function TextToSpeechJob({ job }: { job: DVMJob }) {
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
        <CardBody px="4" py="4" gap="2" display="flex" flexDirection="column">
          {job.responses.length === 0 && (
            <Flex gap="2" alignItems="center">
              <Spinner />
              Waiting for response
            </Flex>
          )}
          {Object.values(job.responses).map((response) => (
            <TextToSpeechResponse key={response.pubkey} response={response} />
          ))}
        </CardBody>
      </Card>
      {debug.isOpen && <EventDebugModal isOpen onClose={debug.onClose} event={job.request} />}
    </>
  );
}
