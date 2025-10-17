import { Alert, AlertDescription, AlertIcon, AlertTitle, Button, Flex } from "@chakra-ui/react";
import { useActiveAccount, useObservableMemo } from "applesauce-react/hooks";
import { kinds, NostrEvent } from "nostr-tools";
import { Navigate, useParams } from "react-router-dom";

import { getSeenRelays, normalizeURL } from "applesauce-core/helpers";
import { useCallback } from "react";
import SimpleView from "../../../components/layout/presets/simple-view";
import RelayFavicon from "../../../components/relay/relay-favicon";
import RelayLink from "../../../components/relay/relay-link";
import GenericNoteTimeline from "../../../components/timeline-page/generic-note-timeline";
import TimelineActionAndStatus from "../../../components/timeline/timeline-action-and-status";
import { useAppTitle } from "../../../hooks/use-app-title";
import useAsyncAction from "../../../hooks/use-async-action";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import authenticationSigner from "../../../services/authentication-signer";
import pool from "../../../services/pool";
import { RelayFavoriteButton } from "./components/relay-favorite-button";
import useClientSideMuteFilter from "../../../hooks/use-client-side-mute-filter";

export function RelayAuthAlert({ relay }: { relay: string }) {
  const account = useActiveAccount();
  const authenticated = useObservableMemo(() => pool.relay(relay).authenticated$, [relay]);
  const required = useObservableMemo(() => pool.relay(relay).authRequiredForRead$, [relay]);
  const response = useObservableMemo(() => pool.relay(relay).authenticationResponse$, [relay]);

  const authenticate = useAsyncAction(async () => {
    if (!account) throw new Error("No account");
    await authenticationSigner.authenticate(relay);
  });

  if (!required || authenticated) return null;

  if (response?.ok === false && response.message)
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Authentication error</AlertTitle>
        <AlertDescription>{response.message}</AlertDescription>
      </Alert>
    );

  return (
    <Alert status="warning">
      <AlertIcon />
      <AlertTitle>Authentication required</AlertTitle>
      <AlertDescription>This relay requires authentication to read.</AlertDescription>
      <Button ms="auto" colorScheme="primary" onClick={authenticate.run} isLoading={authenticate.loading}>
        Authenticate
      </Button>
    </Alert>
  );
}

export function RelayFeedPage({ relay }: { relay: string }) {
  relay = normalizeURL(relay);

  const muteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (!getSeenRelays(event)?.has(relay)) return false;
      if (muteFilter(event)) return false;
      return true;
    },
    [relay, muteFilter],
  );

  const { loader, timeline } = useTimelineLoader(
    `relay-feed-${relay}`,
    [relay],
    { kinds: [kinds.ShortTextNote] },
    { eventFilter },
  );

  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <SimpleView
      title={
        <Flex gap="2" alignItems="center">
          <RelayFavicon relay={relay} size="sm" />
          <RelayLink relay={relay} fontWeight="bold" isTruncated />
        </Flex>
      }
      actions={<RelayFavoriteButton relay={relay} ms="auto" colorScheme="yellow" variant="ghost" />}
      center
      maxW="container.xl"
    >
      <RelayAuthAlert relay={relay} />

      <IntersectionObserverProvider callback={callback}>
        {timeline && <GenericNoteTimeline timeline={timeline} />}
        <TimelineActionAndStatus loader={loader} />
      </IntersectionObserverProvider>
    </SimpleView>
  );
}

export default function RelayFeedView() {
  const { relay } = useParams();
  useAppTitle(`${relay} - Feed`);

  if (!relay) return <Navigate to="/feeds/relays" />;

  return <RelayFeedPage relay={relay} />;
}
