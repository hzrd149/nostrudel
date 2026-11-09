import { Box, Button, Flex, Input, Link, Spinner, Text } from "@chakra-ui/react";
import type { IntentRequest } from "@kehto/services";
import { use$, useActiveAccount } from "applesauce-react/hooks";
import type { NostrEvent } from "nostr-tools";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

import { handlerReference } from "../../helpers/nostr/handler-preferences";
import {
  getNappletAddress,
  getNappletCatalogId,
  getNappletDescription,
  getNappletTitle,
  NAPPLET_KIND_ROOT,
  NAPPLET_KIND_NAMED,
} from "../../helpers/nostr/napplets";
import useAsyncAction from "../../hooks/use-async-action";
import { useReadRelays } from "../../hooks/use-client-relays";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { handlerManifests$, saveHandlerEntry, setLocalHandlerPreference } from "../../services/handler-preferences";
import {
  isNappletHandlerAllowed,
  rememberHandlerManifest,
  supportsNappletIntent,
} from "../../services/napplet-handlers";
import UserLink from "../user/user-link";
import NappletIcon from "./napplet-icon";
import useInfiniteNappletTimeline from "../../hooks/use-infinite-napplet-timeline";

/** Shared discovery surface for direct navigation and a running napplet's intent prompt. */
export default function NappletDiscovery({
  request,
  onSelect,
}: {
  request?: IntentRequest;
  onSelect: (event: NostrEvent) => void;
}) {
  const [search, setSearch] = useState("");
  const account = useActiveAccount();
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const known = use$(handlerManifests$);
  const relays = useReadRelays();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (!isNappletHandlerAllowed(event)) return false;
      if (!request) return true;
      if (!supportsNappletIntent(event, request.archetype, request.convention)) return false;
      return !request.handler || ["default", "choose", getNappletCatalogId(event)].includes(request.handler);
    },
    [request],
  );
  const query = useMemo(
    () => ({ kinds: [NAPPLET_KIND_ROOT, NAPPLET_KIND_NAMED], ...(request ? { "#i": [request.convention] } : {}) }),
    [request],
  );
  const { timeline, loader } = useTimelineLoader(`napplet-discovery:${request?.convention ?? "all"}`, relays, query, {
    eventFilter,
  });
  const { end, loading, error } = useInfiniteNappletTimeline(loader);
  const events = useMemo(() => {
    const byId = new Map<string, NostrEvent>();
    for (const event of [...known.values(), ...timeline]) {
      if (!eventFilter(event)) continue;
      const id = getNappletCatalogId(event);
      const previous = byId.get(id);
      if (!previous || event.created_at > previous.created_at) byId.set(id, event);
    }
    const term = search.trim().toLowerCase();
    return [...byId.values()].filter((event) =>
      `${getNappletTitle(event)} ${getNappletDescription(event) ?? ""}`.toLowerCase().includes(term),
    );
  }, [known, timeline, eventFilter, search]);
  const select = useAsyncAction(
    async (event: NostrEvent) => {
      if (!isNappletHandlerAllowed(event)) throw new Error("Napplet is no longer available");
      rememberHandlerManifest(event);
      if (request) {
        const reference = handlerReference(getNappletAddress(event)!)!;
        if (account)
          await saveHandlerEntry(
            request.archetype,
            { reference, convention: request.convention, private: true },
            false,
            true,
          );
        else setLocalHandlerPreference(request.convention, reference);
      }
      if (mounted.current) onSelect(event);
    },
    [account, request, onSelect],
  );

  return (
    <Flex direction="column" gap="4">
      <Input
        type="search"
        aria-label="Search napplets"
        placeholder="Search napplets"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {events.map((event) => (
        <Flex key={event.id} gap="3" align="center" wrap="wrap">
          <NappletIcon event={event} boxSize="12" />
          <Flex direction="column" flex="1" minW="0">
            <Link as={RouterLink} to={`/app/store/${getNappletAddress(event)}`} fontWeight="semibold">
              {getNappletTitle(event)}
            </Link>
            <UserLink pubkey={event.pubkey} />
            {getNappletDescription(event) && <Text noOfLines={2}>{getNappletDescription(event)}</Text>}
          </Flex>
          <Button colorScheme="primary" isLoading={select.loading} onClick={() => select.run(event)}>
            {request ? "Use napplet" : "Open"}
          </Button>
        </Flex>
      ))}
      {loading && <Spinner />}
      {error && <Text role="alert">{error}</Text>}
      {!loading && events.length === 0 && <Text>No matching napplets found.</Text>}
      <Box ref={end} minH="1px" aria-hidden />
    </Flex>
  );
}
