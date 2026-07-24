import { Alert, AlertDescription, AlertIcon, Flex, Spinner, Text } from "@chakra-ui/react";
import { DecodeResult } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { useEffect, useMemo } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";

import NappletFrame from "../../components/napplets/napplet-frame";
import SimpleView from "../../components/layout/presets/simple-view";
import {
  getNappletEventPointer,
  getNappletNaddr,
  NAPPLET_INTENT_PARAM,
  encodeNappletIntent,
  isNappletManifestKind,
  parseNappletIntent,
  parseNappletPointer,
  type NappletIntent,
} from "../../helpers/nostr/napplets";
import useEvent from "../../hooks/use-event";
import { useNappletShell } from "../../providers/global/napplet-shell-provider";

export function NappletRouteLoader({
  address,
  pointer,
  intent,
}: {
  address: string;
  pointer: DecodeResult;
  intent?: NappletIntent;
}) {
  const navigate = useNavigate();
  const eventPointer = useMemo(() => getNappletEventPointer(pointer), [pointer]);
  const event: NostrEvent | undefined = useEvent(eventPointer);

  useEffect(() => {
    if (!event || !isNappletManifestKind(event.kind)) return;

    const naddr = getNappletNaddr(event);
    if (!naddr) return;

    if (naddr !== address) {
      const search = intent ? `?${NAPPLET_INTENT_PARAM}=${encodeNappletIntent(intent)}` : "";
      navigate(`/app/${naddr}${search}`, { replace: true });
    }
  }, [address, event, intent, navigate]);

  if (!eventPointer)
    return (
      <SimpleView title="Napplet">
        <Alert status="warning">
          <AlertIcon />
          <AlertDescription>{pointer.type} pointers cannot reference an installed napplet.</AlertDescription>
        </Alert>
      </SimpleView>
    );

  if (!event)
    return (
      <SimpleView title="Napplet" scroll={false}>
        <Flex flexGrow={1} h={0} direction="column" alignItems="center" justifyContent="center" gap="2">
          <Spinner />
          <Text color="GrayText">Loading manifest event...</Text>
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
          <AlertDescription>
            This napplet manifest cannot be installed because it does not have a naddr.
          </AlertDescription>
        </Alert>
      </SimpleView>
    );

  return <NappletFrame event={event} intent={intent} />;
}

export default function NappletView() {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setIntentNavigator } = useNappletShell();
  const pointer = useMemo(() => (address ? parseNappletPointer(address) : undefined), [address]);
  const intent = useMemo(() => parseNappletIntent(searchParams.get(NAPPLET_INTENT_PARAM)), [searchParams]);

  useEffect(() => {
    setIntentNavigator((nextIntent, handler) => {
      const archetype = handler.archetypes.find((entry) => entry.name === nextIntent.archetype)?.name;
      navigate(`/app/${archetype || handler.address}?${NAPPLET_INTENT_PARAM}=${encodeNappletIntent(nextIntent)}`);
    });

    return () => setIntentNavigator(null);
  }, [navigate, setIntentNavigator]);

  if (!address || !pointer)
    return (
      <SimpleView title="Napplet">
        <Alert status="error">
          <AlertIcon />
          <AlertDescription>Invalid NIP-19 pointer</AlertDescription>
        </Alert>
      </SimpleView>
    );

  return <Navigate to={`/app/${address}${searchParams.size > 0 ? `?${searchParams.toString()}` : ""}`} replace />;
}
