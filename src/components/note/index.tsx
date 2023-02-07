import React from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import moment from "moment";
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  Heading,
  HStack,
  IconButton,
  VStack,
  Link,
} from "@chakra-ui/react";
import { NostrEvent } from "../../types/nostr-event";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import { UserAvatarLink } from "../user-avatar-link";
import { getUserDisplayName } from "../../helpers/user-metadata";
import { Bech32Prefix, normalizeToBech32 } from "../../helpers/nip-19";

import { NoteContents } from "./note-contents";
import { NoteMenu } from "./note-menu";
import { NoteCC } from "./note-cc";
import { isReply } from "../../helpers/nostr-event";
import useSubject from "../../hooks/use-subject";
import identity from "../../services/identity";
import { useUserContacts } from "../../hooks/use-user-contacts";
import { ArrowDownSIcon } from "../icons";
import { UserTipButton } from "../user-tip-button";

export type NoteProps = {
  event: NostrEvent;
};
export const Note = React.memo(({ event }: NoteProps) => {
  const metadata = useUserMetadata(event.pubkey);

  const pubkey = useSubject(identity.pubkey);
  const contacts = useUserContacts(pubkey);
  const following = contacts?.contacts || [];

  return (
    <Card padding="2" variant="outline">
      <CardHeader padding="0" mb="2">
        <Flex gap="2">
          <Flex flex="1" gap="2">
            <UserAvatarLink pubkey={event.pubkey} size="sm" />

            <Box>
              <Heading size="sm" display="inline">
                <Link as={RouterLink} to={`/u/${normalizeToBech32(event.pubkey, Bech32Prefix.Pubkey)}`}>
                  {getUserDisplayName(metadata, event.pubkey)}
                </Link>
              </Heading>
              <Link as={RouterLink} to={`/n/${normalizeToBech32(event.id, Bech32Prefix.Note)}`} ml="2">
                {moment(event.created_at * 1000).fromNow()}
              </Link>
              {isReply(event) && <NoteCC event={event} />}
            </Box>
          </Flex>
          <UserTipButton pubkey={event.pubkey} size="xs" />
          <NoteMenu event={event} />
        </Flex>
      </CardHeader>
      <CardBody padding="0">
        <Box overflow="hidden" width="100%">
          <NoteContents event={event} trusted={following.includes(event.pubkey)} />
        </Box>
      </CardBody>
      {/* <CardFooter padding="0" gap="2"> */}
      {/* <Button
          size="sm"
          variant="link"
          onClick={() => navigate(`/n/${normalizeToBech32(event.id, Bech32Prefix.Note)}`)}
        >
          Replies
        </Button> */}
      {/* <ButtonGroup size="sm" isAttached variant="outline" ml="auto">
          <Button>Like</Button>
          <IconButton aria-label="Show Likes" icon={<ArrowDownS />} />
        </ButtonGroup> */}
      {/* </CardFooter> */}
    </Card>
  );
});
