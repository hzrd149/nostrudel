import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  DrawerProps,
  Flex,
  Heading,
  IconButton,
  Switch,
  Text,
} from "@chakra-ui/react";
import { useReadRelays, useWriteRelays } from "../../hooks/use-client-relays";
import { useMemo } from "react";
import relayPoolService from "../../services/relay-pool";
import useSubject from "../../hooks/use-subject";
import { RelayUrlInput } from "../relay-url-input";
import { useForm } from "react-hook-form";
import clientRelaysService from "../../services/client-relays";
import { RelayMode } from "../../classes/relay";
import RelaySet from "../../classes/relay-set";
import { CloseIcon } from "@chakra-ui/icons";
import Circle from "../icons/circle";
import { safeRelayUrl } from "../../helpers/relay";
import UploadCloud01 from "../icons/upload-cloud-01";
import { RelayFavicon } from "../relay-favicon";

function RelayControl({ url }: { url: string }) {
  const relay = useMemo(() => relayPoolService.requestRelay(url, false), [url]);
  const status = useSubject(relay.status);
  const writeRelays = useSubject(clientRelaysService.writeRelays);

  let color = "gray";
  switch (status) {
    case WebSocket.OPEN:
      color = "green";
      break;
    case WebSocket.CONNECTING:
      color = "yellow";
      break;
    case WebSocket.CLOSED:
      color = "red";
      break;
  }

  const onChange = () => {
    if (writeRelays.has(url)) clientRelaysService.removeRelay(url, RelayMode.WRITE);
    else clientRelaysService.addRelay(url, RelayMode.WRITE);
  };

  return (
    <Flex gap="2" alignItems="center">
      <RelayFavicon relay={url} size="xs" outline="2px solid" outlineColor={color} />
      <Text fontFamily="monospace" fontSize="md" flexGrow={1} isTruncated title={url}>
        {url}
      </Text>
      <IconButton
        aria-label="Toggle Write"
        icon={<UploadCloud01 />}
        size="sm"
        variant={writeRelays.has(url) ? "solid" : "ghost"}
        colorScheme={writeRelays.has(url) ? "green" : "gray"}
        onClick={onChange}
        title="Toggle Write"
      />
      <IconButton
        aria-label="Remove Relay"
        icon={<CloseIcon />}
        size="sm"
        colorScheme="red"
        onClick={() => clientRelaysService.removeRelay(url, RelayMode.ALL)}
      />
    </Flex>
  );
}

function AddRelayForm() {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      url: "",
    },
  });

  const submit = handleSubmit((values) => {
    const url = safeRelayUrl(values.url);
    if (!url) return;
    clientRelaysService.addRelay(url, RelayMode.READ);
    reset();
  });

  return (
    <Flex as="form" display="flex" gap="2" onSubmit={submit}>
      <RelayUrlInput {...register("url")} placeholder="wss://relay.example.com" />
      <Button type="submit">Add</Button>
    </Flex>
  );
}

export default function RelayManagementDrawer({ isOpen, onClose, ...props }: Omit<DrawerProps, "children">) {
  const readRelays = useReadRelays();
  const writeRelays = useWriteRelays();

  const sorted = useMemo(() => RelaySet.from(readRelays, writeRelays).urls.sort(), [readRelays, writeRelays]);
  const others = Array.from(relayPoolService.relays.values())
    .filter((r) => !r.closed && !sorted.includes(r.url))
    .map((r) => r.url)
    .sort();

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md" {...props}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader px="4" py="2">
          Relays
        </DrawerHeader>

        <DrawerBody px={{ base: 2, md: 4 }} pb="2" pt="0" display="flex" gap="2" flexDir="column">
          <AddRelayForm />
          {sorted.map((url) => (
            <RelayControl key={url} url={url} />
          ))}
          <Heading size="sm">Other Relays</Heading>
          {others.map((url) => (
            <RelayControl key={url} url={url} />
          ))}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
