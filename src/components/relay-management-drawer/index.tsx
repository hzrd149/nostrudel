import { useMemo, useState } from "react";
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
  Link,
  Select,
  useDisclosure,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";
import { NostrEvent } from "nostr-tools";

import { useReadRelays, useWriteRelays } from "../../hooks/use-client-relays";
import relayPoolService from "../../services/relay-pool";
import useSubject from "../../hooks/use-subject";
import clientRelaysService from "../../services/client-relays";
import { RelayMode } from "../../classes/relay";
import RelaySet from "../../classes/relay-set";
import UploadCloud01 from "../icons/upload-cloud-01";
import { RelayFavicon } from "../relay-favicon";
import useUserRelaySets from "../../hooks/use-user-relay-sets";
import useCurrentAccount from "../../hooks/use-current-account";
import { getListName } from "../../helpers/nostr/lists";
import { getEventCoordinate } from "../../helpers/nostr/events";
import AddRelayForm from "./add-relay-form";
import { SaveRelaySetForm } from "./save-relay-set-form";

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
      <Link as={RouterLink} to={`/r/${encodeURIComponent(url)}`} isTruncated>
        {url}
      </Link>
      <IconButton
        ml="auto"
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

function SelectRelaySet({
  value,
  onChange,
  relaySets,
}: {
  relaySets: NostrEvent[];
  value?: string;
  onChange: (cord: string) => void;
}) {
  return (
    <Select
      size="sm"
      borderRadius="md"
      placeholder="Custom Relays"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {relaySets.map((set) => (
        <option key={set.id} value={getEventCoordinate(set)}>
          {getListName(set)}
        </option>
      ))}
    </Select>
  );
}

export default function RelayManagementDrawer({ isOpen, onClose, ...props }: Omit<DrawerProps, "children">) {
  const account = useCurrentAccount();
  const readRelays = useReadRelays();
  const writeRelays = useWriteRelays();

  const sorted = useMemo(() => RelaySet.from(readRelays, writeRelays).urls.sort(), [readRelays, writeRelays]);
  const others = Array.from(relayPoolService.relays.values())
    .filter((r) => !r.closed && !sorted.includes(r.url))
    .map((r) => r.url)
    .sort();

  const save = useDisclosure();
  const [selected, setSelected] = useState<string>();
  const relaySets = useUserRelaySets(account?.pubkey);

  const changeSet = (cord: string) => {
    setSelected(cord);

    const set = relaySets.find((s) => getEventCoordinate(s) === cord);
    if (set) {
      clientRelaysService.setRelaysFromRelaySet(set);
    }
  };

  const renderContent = () => {
    if (save.isOpen) {
      return (
        <>
          <SaveRelaySetForm
            relaySet={relaySets.find((s) => getEventCoordinate(s) === selected)}
            onCancel={save.onClose}
            onSaved={(set) => {
              save.onClose();
              setSelected(getEventCoordinate(set));
            }}
            writeRelays={clientRelaysService.writeRelays.value}
            readRelays={clientRelaysService.readRelays.value}
          />
        </>
      );
    }
    return (
      <>
        <Flex gap="2">
          <SelectRelaySet relaySets={relaySets} value={selected} onChange={changeSet} />
          <Button size="sm" colorScheme="primary" onClick={save.onOpen}>
            Save
          </Button>
        </Flex>
        {sorted.map((url) => (
          <RelayControl key={url} url={url} />
        ))}
        <AddRelayForm
          onSubmit={(url) => {
            clientRelaysService.addRelay(url, RelayMode.ALL);
            setSelected(undefined);
          }}
        />
        {/* <Heading size="sm">Other Relays</Heading>
        {others.map((url) => (
          <RelayControl key={url} url={url} />
        ))} */}
      </>
    );
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md" closeOnEsc={false} {...props}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader px="4" py="2">
          Relays
        </DrawerHeader>

        <DrawerBody px={{ base: 2, md: 4 }} pb="2" pt="0" display="flex" gap="2" flexDir="column">
          {renderContent()}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
