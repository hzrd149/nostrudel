import { Card, CardBody, CardHeader, Flex, IconButton, Spacer, Spinner, Text, useDisclosure } from "@chakra-ui/react";
import codes from "iso-language-codes";

import { DVMJob, getRequestInputParam } from "../../../../helpers/nostr/dvm";
import { NostrEvent } from "../../../../types/nostr-event";
import { CodeIcon } from "../../../../components/icons";
import Timestamp from "../../../../components/timestamp";
import UserLink from "../../../../components/user-link";
import UserAvatarLink from "../../../../components/user-avatar-link";
import NoteDebugModal from "../../../../components/debug-modals/note-debug-modal";
import TranslationResponse from "./translation-response";

function getTranslationJobLanguage(request: NostrEvent) {
  const targetLanguage = getRequestInputParam(request, "language", false);
  return codes.find((code) => code.iso639_1 === targetLanguage);
}

export default function TranslationJob({ job }: { job: DVMJob }) {
  const lang = getTranslationJobLanguage(job.request);
  const debug = useDisclosure();

  return (
    <>
      <Card variant="outline">
        <CardHeader px="4" pt="4" pb="0" display="flex" gap="2" alignItems="center" flexWrap="wrap">
          <UserAvatarLink pubkey={job.request.pubkey} size="sm" />
          <UserLink pubkey={job.request.pubkey} fontWeight="bold" />
          <Text>
            Requested translation to <strong>{lang?.nativeName}</strong>
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
            <Flex gap="2" alignItems="center" m="4">
              <Spinner />
              Waiting for response
            </Flex>
          )}
          {job.responses.map((response) => (
            <TranslationResponse key={response.pubkey} response={response} />
          ))}
        </CardBody>
      </Card>
      {debug.isOpen && <NoteDebugModal isOpen onClose={debug.onClose} event={job.request} />}
    </>
  );
}
