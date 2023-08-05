import { forwardRef, useState } from "react";
import {
  Button,
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputProps,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  useDisclosure,
} from "@chakra-ui/react";
import { useAsync } from "react-use";
import { unique } from "../helpers/array";
import { RelayIcon, SearchIcon } from "./icons";

function RelayPickerModal({
  onSelect,
  onClose,
  ...props
}: { onSelect: (relay: string) => void } & Omit<ModalProps, "children">) {
  const [search, setSearch] = useState("");
  const { value: onlineRelays } = useAsync(async () =>
    fetch("https://api.nostr.watch/v1/online").then((res) => res.json() as Promise<string[]>)
  );
  const relayList = unique(onlineRelays ?? []);

  const filteredRelays = search ? relayList.filter((url) => url.includes(search)) : relayList;

  return (
    <Modal onClose={onClose} {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Pick Relay</ModalHeader>
        <ModalCloseButton />
        <ModalBody pt="0" px="4" pb="4">
          <InputGroup mb="2">
            <InputLeftElement pointerEvents="none" children={<SearchIcon />} />
            <Input
              type="search"
              placeholder="Search"
              name="relay-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
          <Flex gap="2" direction="column">
            {filteredRelays.map((url) => (
              <Button
                value={url}
                onClick={() => {
                  onSelect(url);
                  onClose();
                }}
                variant="outline"
                size="sm"
              >
                {url}
              </Button>
            ))}
          </Flex>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export type RelayUrlInputProps = Omit<InputProps, "type">;

export const RelayUrlInput = forwardRef(
  ({ onChange, ...props }: Omit<RelayUrlInputProps, "onChange"> & { onChange: (url: string) => void }, ref) => {
    const { isOpen, onClose, onOpen } = useDisclosure();
    const { value: relaysJson } = useAsync(async () =>
      fetch("https://api.nostr.watch/v1/online").then((res) => res.json() as Promise<string[]>)
    );
    const relaySuggestions = unique(relaysJson ?? []);

    return (
      <>
        <InputGroup>
          <Input ref={ref} list="relay-suggestions" type="url" onChange={(e) => onChange(e.target.value)} {...props} />
          <datalist id="relay-suggestions">
            {relaySuggestions.map((url) => (
              <option key={url} value={url}>
                {url}
              </option>
            ))}
          </datalist>
          <InputRightElement>
            <IconButton icon={<RelayIcon />} aria-label="Pick from list" size="sm" onClick={onOpen} />
          </InputRightElement>
        </InputGroup>
        <RelayPickerModal onClose={onClose} isOpen={isOpen} onSelect={(url) => onChange(url)} size="2xl" />
      </>
    );
  }
);
