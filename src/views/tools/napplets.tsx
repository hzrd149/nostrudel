import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { DecodeResult } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { FormEventHandler, useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import SimpleView from "../../components/layout/presets/simple-view";
import {
  getNappletArchetypes,
  getNappletEventPointer,
  getNappletNaddr,
  getNappletTitle,
  NAPPLET_INTENT_PARAM,
  encodeNappletIntent,
  isNappletManifestKind,
  parseNappletIntent,
  parseNappletPointer,
  type NappletIntent,
} from "../../helpers/nostr/napplets";
import useEvent from "../../hooks/use-event";
import { useNappletShell } from "../../providers/global/napplet-shell-provider";
import { addRecentNappletEvent } from "../../services/recent-napplets";
import { getInstalledNapplets, installNapplet, uninstallNapplet } from "../../services/installed-napplets";
import InstalledNappletCard from "../napplets/components/installed-napplet-card";

// Loads the manifest event for a pointer, then mounts it full-page. The napplet
// auto-launches — there is no manual launch step once an address is set.
function NappletLoader({
  pointer,
  intent,
}: {
  pointer: DecodeResult;
  intent?: NappletIntent;
}) {
  const navigate = useNavigate();
  // Call useEvent unconditionally (rules of hooks); it no-ops on an undefined pointer.
  const eventPointer = useMemo(() => getNappletEventPointer(pointer), [pointer]);
  const event: NostrEvent | undefined = useEvent(eventPointer);

  // Install loaded napplets locally and hand off to the first-class route.
  useEffect(() => {
    if (!event || !isNappletManifestKind(event.kind)) return;

    const naddr = getNappletNaddr(event);
    if (!naddr) return;

    installNapplet(event, naddr);
    addRecentNappletEvent({
      address: naddr,
      title: getNappletTitle(event),
      event,
      archetypes: getNappletArchetypes(event),
    });

    const search = intent ? `?${NAPPLET_INTENT_PARAM}=${encodeNappletIntent(intent)}` : "";
    navigate(`/napplets/${naddr}${search}`, { replace: true });
  }, [event, intent, navigate]);

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

  if (!getNappletNaddr(event))
    return (
      <SimpleView title="Napplet">
        <Alert status="warning">
          <AlertIcon />
          <AlertDescription>This napplet manifest cannot be installed because it does not have a naddr.</AlertDescription>
        </Alert>
      </SimpleView>
    );

  return (
    <SimpleView title="Napplet" scroll={false}>
      <Flex flexGrow={1} h={0} direction="column" alignItems="center" justifyContent="center" gap="2">
        <Spinner />
        <Text color="GrayText">Installing napplet...</Text>
      </Flex>
    </SimpleView>
  );
}

export default function NappletToolView() {
  // The loaded napplet address is stored in the URL (/tools/napplets/<address>)
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setIntentNavigator } = useNappletShell();
  const [value, setValue] = useState(address ?? "");
  const [installed, setInstalled] = useState(() => getInstalledNapplets());

  const pointer = useMemo(() => (address ? parseNappletPointer(address) : undefined), [address]);
  const intent = useMemo(() => parseNappletIntent(searchParams.get(NAPPLET_INTENT_PARAM)), [searchParams]);

  // Keep the input in sync with the URL, and refresh installed napplets when returning home.
  useEffect(() => {
    setValue(address ?? "");
    if (!address) setInstalled(getInstalledNapplets());
  }, [address]);

  const submit = useCallback<FormEventHandler<HTMLFormElement>>(
    (e) => {
      e.preventDefault();
      const trimmed = value.trim();
      navigate(trimmed ? `/tools/napplets/${trimmed}` : "/tools/napplets");
    },
    [navigate, value],
  );

  useEffect(() => {
    setIntentNavigator((nextIntent, handler) => {
      navigate(`/napplets/${handler.address}?${NAPPLET_INTENT_PARAM}=${encodeNappletIntent(nextIntent)}`);
    });

    return () => setIntentNavigator(null);
  }, [navigate, setIntentNavigator]);

  const removeInstalled = useCallback((target: string) => {
    uninstallNapplet(target);
    setInstalled(getInstalledNapplets());
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

    return <NappletLoader pointer={pointer} intent={intent} />;
  }

  // No address: prompt for a manifest pointer, and list installed napplets.
  return (
    <SimpleView title="Napplets">
      <Text color="GrayText">Paste a NIP-5D manifest pointer to install and mount it as a local mini app.</Text>
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

      {installed.length > 0 && (
        <>
          <Heading size="sm" mt="2">
            Installed
          </Heading>
          <Flex direction="column" gap="2">
            {installed.map((napplet) => (
              <InstalledNappletCard
                key={napplet.address}
                napplet={napplet}
                onUninstall={() => removeInstalled(napplet.address)}
              />
            ))}
          </Flex>
        </>
      )}
    </SimpleView>
  );
}
