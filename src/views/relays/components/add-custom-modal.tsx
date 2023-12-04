import {
  Box,
  Button,
  ButtonGroup,
  Code,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useState } from "react";
import { useRelayInfo } from "../../../hooks/use-relay-info";
import UserAvatar from "../../../components/user-avatar";
import UserLink from "../../../components/user-link";
import { safeRelayUrl } from "../../../helpers/url";
import { useDebounce } from "react-use";
import { UserDnsIdentityIcon } from "../../../components/user-dns-identity-icon";
import { CodeIcon } from "../../../components/icons";
import { Metadata } from "./relay-card";

function RelayDetails({ url, debug }: { url: string; debug?: boolean }) {
  const { info } = useRelayInfo(url);

  if (!info) return null;

  return (
    <Box>
      <Metadata name="Name">{info.name}</Metadata>
      <Metadata name="URL">{url}</Metadata>
      {info.pubkey && (
        <Flex gap="2" alignItems="center">
          <Text fontWeight="bold">Owner: </Text>
          <UserAvatar pubkey={info.pubkey} size="xs" />
          <UserLink pubkey={info.pubkey} />
          <UserDnsIdentityIcon pubkey={info.pubkey} onlyIcon />
        </Flex>
      )}
      <Metadata name="NIPs">{info.supported_nips?.join(", ")}</Metadata>
      {debug && (
        <Code whiteSpace="pre" overflow="auto">
          {JSON.stringify(info, null, 2)}
        </Code>
      )}
    </Box>
  );
}

export default function AddCustomRelayModal({
  onSubmit,
  ...props
}: { onSubmit: (relay: string) => void } & Omit<ModalProps, "children">) {
  const [url, setUrl] = useState("");
  const [safeUrl, setSafeUrl] = useState<string>();
  const showDebug = useDisclosure();

  useDebounce(() => setSafeUrl(safeRelayUrl(url) ?? undefined), 1000, [url]);

  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader p="4">Custom Relay</ModalHeader>
        <ModalCloseButton />
        <ModalBody px="4" py="0" display="flex" flexDirection="column" gap="2">
          <FormControl>
            <FormLabel>Relay URL</FormLabel>
            <Input
              type="url"
              placeholder="wss://relay.example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </FormControl>

          {safeUrl && <RelayDetails url={safeUrl} debug={showDebug.isOpen} />}
        </ModalBody>

        <ModalFooter p="4">
          <ButtonGroup size="sm">
            {safeUrl && (
              <IconButton icon={<CodeIcon />} aria-label="Show JSON" onClick={showDebug.onToggle} variant="ghost" />
            )}
            <Button variant="ghost" onClick={props.onClose}>
              Cancel
            </Button>
            <Button colorScheme="primary" onClick={() => safeUrl && onSubmit(safeUrl)} isDisabled={!safeUrl}>
              Add
            </Button>
          </ButtonGroup>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
