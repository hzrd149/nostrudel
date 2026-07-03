import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  IconButton,
  Input,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { DecodeResult } from "applesauce-core/helpers";
import { nip19, NostrEvent } from "nostr-tools";
import { FormEventHandler, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import NappletFrame from "../../components/napplets/napplet-frame";
import SimpleView from "../../components/layout/presets/simple-view";
import UserAvatar from "../../components/user/user-avatar";
import UserName from "../../components/user/user-name";
import Timestamp from "../../components/timestamp";
import { getNappletTitle, isNappletManifestKind } from "../../helpers/nostr/napplets";
import useEvent from "../../hooks/use-event";
import {
  addRecentNapplet,
  getRecentNapplets,
  removeRecentNapplet,
  type RecentNapplet,
} from "../../services/recent-napplets";

function parsePointer(value: string): DecodeResult | undefined {
  try {
    return nip19.decode(value.trim()) as DecodeResult;
  } catch {
    return undefined;
  }
}

// The three NIP-19 entities that can point to a napplet manifest event:
// note/nevent -> a snapshot/root/named event by id, naddr -> a root/named event by coordinate.
function nappletEventPointer(pointer: DecodeResult) {
  switch (pointer.type) {
    case "note":
    case "nevent":
    case "naddr":
      return pointer.data;
    default:
      return undefined;
  }
}

// Loads the manifest event for a pointer, then mounts it full-page. The napplet
// auto-launches — there is no manual launch step once an address is set.
function NappletLoader({ address, pointer, onClose }: { address: string; pointer: DecodeResult; onClose: () => void }) {
  // Call useEvent unconditionally (rules of hooks); it no-ops on an undefined pointer.
  const eventPointer = useMemo(() => nappletEventPointer(pointer), [pointer]);
  const event: NostrEvent | undefined = useEvent(eventPointer);

  // Remember loaded napplets so they can be re-selected from the home view.
  useEffect(() => {
    if (event && isNappletManifestKind(event.kind))
      addRecentNapplet({ address, title: getNappletTitle(event), pubkey: event.pubkey });
  }, [event, address]);

  if (!eventPointer)
    return (
      <SimpleView title="Napplet">
        <Alert status="warning">
          <AlertIcon />
          <AlertDescription>
            {pointer.type} pointers cannot reference a napplet. Paste a naddr, nevent, or note pointer.
          </AlertDescription>
        </Alert>
      </SimpleView>
    );

  if (!event)
    return (
      <SimpleView title="Napplet" scroll={false}>
        <Flex flexGrow={1} h={0} direction="column" alignItems="center" justifyContent="center" gap="2">
          <Spinner />
          <Text color="GrayText">Loading manifest event…</Text>
        </Flex>
      </SimpleView>
    );

  if (!isNappletManifestKind(event.kind))
    return (
      <SimpleView title="Napplet">
        <Alert status="warning">
          <AlertIcon />
          <AlertDescription>Loaded event kind {event.kind}, but it is not a NIP-5D napplet manifest.</AlertDescription>
        </Alert>
      </SimpleView>
    );

  return <NappletFrame event={event} onClose={onClose} />;
}

function RecentNappletCard({
  napplet,
  onSelect,
  onRemove,
}: {
  napplet: RecentNapplet;
  onSelect: () => void;
  onRemove: () => void;
}) {
  return (
    <Card variant="outline" size="sm" cursor="pointer" onClick={onSelect} _hover={{ borderColor: "primary.500" }}>
      <CardBody p="2">
        <Flex alignItems="center" gap="3">
          <UserAvatar pubkey={napplet.pubkey} size="sm" />
          <Box flex="1" minW="0">
            <Text fontWeight="semibold" noOfLines={1}>
              {napplet.title}
            </Text>
            <Flex gap="1" fontSize="xs" color="GrayText" alignItems="center" minW="0">
              <UserName pubkey={napplet.pubkey} fontSize="xs" isTruncated />
              <Text>·</Text>
              <Timestamp timestamp={Math.round(napplet.loadedAt / 1000)} whiteSpace="nowrap" />
            </Flex>
          </Box>
          <IconButton
            size="sm"
            variant="ghost"
            aria-label="Remove from recent"
            icon={<CloseIcon />}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          />
        </Flex>
      </CardBody>
    </Card>
  );
}

export default function NappletToolView() {
  // The loaded napplet address is stored in the URL (/tools/napplets/<address>)
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const [value, setValue] = useState(address ?? "");
  const [recent, setRecent] = useState<RecentNapplet[]>(() => getRecentNapplets());

  const pointer = useMemo(() => (address ? parsePointer(address) : undefined), [address]);

  // Keep the input in sync with the URL, and refresh the recent feed when returning home.
  useEffect(() => {
    setValue(address ?? "");
    if (!address) setRecent(getRecentNapplets());
  }, [address]);

  const submit = useCallback<FormEventHandler<HTMLFormElement>>(
    (e) => {
      e.preventDefault();
      const trimmed = value.trim();
      navigate(trimmed ? `/tools/napplets/${trimmed}` : "/tools/napplets");
    },
    [navigate, value],
  );

  const close = useCallback(() => navigate("/tools/napplets"), [navigate]);

  const removeRecent = useCallback((target: string) => {
    removeRecentNapplet(target);
    setRecent(getRecentNapplets());
  }, []);

  // When an address is set, auto-launch the napplet full-page (no input bar).
  if (address) {
    if (!pointer)
      return (
        <SimpleView title="Napplet">
          <Alert status="error">
            <AlertIcon />
            <AlertDescription>Invalid NIP-19 pointer</AlertDescription>
          </Alert>
        </SimpleView>
      );

    return <NappletLoader address={address} pointer={pointer} onClose={close} />;
  }

  // No address: prompt for a manifest pointer, and list recently loaded napplets.
  return (
    <SimpleView title="Napplets">
      <Text color="GrayText">Paste a NIP-5D manifest pointer to resolve and mount it in a sandboxed frame.</Text>
      <Box as="form" onSubmit={submit}>
        <Flex gap="2" alignItems="flex-end">
          <FormControl>
            <FormLabel>Manifest pointer</FormLabel>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="naddr1..., nevent1..., or note1..."
            />
          </FormControl>
          <Button type="submit" colorScheme="primary">
            Load
          </Button>
        </Flex>
      </Box>

      {recent.length > 0 && (
        <>
          <Heading size="sm" mt="2">
            Recent
          </Heading>
          <Flex direction="column" gap="2">
            {recent.map((napplet) => (
              <RecentNappletCard
                key={napplet.address}
                napplet={napplet}
                onSelect={() => navigate(`/tools/napplets/${napplet.address}`)}
                onRemove={() => removeRecent(napplet.address)}
              />
            ))}
          </Flex>
        </>
      )}
    </SimpleView>
  );
}
