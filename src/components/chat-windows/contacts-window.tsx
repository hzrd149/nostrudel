import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AlertIcon,
  Button,
  Card,
  CardBody,
  CardHeader,
  CloseButton,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react";
import dayjs from "dayjs";

import { ChevronDownIcon, ChevronUpIcon, SearchIcon } from "../icons";
import useSubject from "../../hooks/use-subject";
import directMessagesService from "../../services/direct-messages";
import UserAvatar from "../user-avatar";
import UserName from "../user-name";

export default function ContactsWindow({
  onClose,
  onSelectPubkey,
}: {
  onClose: () => void;
  onSelectPubkey: (pubkey: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  // TODO: find a better way to load recent contacts
  const [from, setFrom] = useState(() => dayjs().subtract(2, "days").unix());
  const conversations = useSubject(directMessagesService.conversations);
  useEffect(() => directMessagesService.loadDateRange(from), [from]);
  const sortedConversations = useMemo(() => {
    return Array.from(conversations).sort((a, b) => {
      const latestA = directMessagesService.getUserMessages(a).value[0]?.created_at ?? 0;
      const latestB = directMessagesService.getUserMessages(b).value[0]?.created_at ?? 0;

      return latestB - latestA;
    });
  }, [conversations]);

  return (
    <Card size="sm" borderRadius="md" minW={expanded ? "sm" : 0}>
      <CardHeader display="flex" gap="2" alignItems="center">
        <Heading size="md" mr="8">
          Contacts
        </Heading>
        <IconButton
          aria-label="Toggle Window"
          onClick={() => setExpanded((v) => !v)}
          variant="ghost"
          icon={expanded ? <ChevronDownIcon /> : <ChevronUpIcon />}
          ml="auto"
          size="sm"
        />
        <CloseButton onClick={onClose} />
      </CardHeader>
      {expanded && (
        <CardBody maxH="lg" overflowX="hidden" overflowY="auto" pt="0" display="flex" flexDirection="column" gap="2">
          <Alert status="warning">
            <AlertIcon />
            Work in progress!
          </Alert>
          {/* <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon />
            </InputLeftElement>
            <Input autoFocus />
          </InputGroup> */}
          {sortedConversations.map((pubkey) => (
            <Button
              key={pubkey}
              leftIcon={<UserAvatar pubkey={pubkey} size="sm" />}
              justifyContent="flex-start"
              p="2"
              variant="ghost"
              onClick={() => onSelectPubkey(pubkey)}
            >
              <UserName pubkey={pubkey} />
            </Button>
          ))}
        </CardBody>
      )}
    </Card>
  );
}
