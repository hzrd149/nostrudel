import { Button, ButtonProps, Link } from "@chakra-ui/react";
import {
  GIT_REPOSITORY_KIND,
  RecommendedHandler,
  createHandlerAddressLink,
  getAppRecommendationsFilter,
  getHandlerName,
  getRecommendedHandlers,
} from "applesauce-common/helpers";
import { AddressPointer, getReplaceableAddressFromPointer } from "applesauce-core/helpers";
import { IdentityStatus } from "applesauce-loaders/helpers/dns-identity";
import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useEffect, useMemo } from "react";

import { NostrRepositoryUri, parseNostrRepositoryUri } from "../../helpers/nostr/git";
import { getNappletSource } from "../../helpers/nostr/napplets";
import { useReadRelays } from "../../hooks/use-client-relays";
import useDnsIdentity from "../../hooks/use-dns-identity";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useUserContacts from "../../hooks/use-user-contacts";

function getWebHandlers(recommendation: NostrEvent): RecommendedHandler[] {
  return getRecommendedHandlers(recommendation).filter((handler) => !handler.platform || handler.platform === "web");
}

/** Picks the user's own recommended repository handler, falling back to the one most recommended by their contacts */
function useRecommendedRepositoryHandler(): AddressPointer | undefined {
  const account = useActiveAccount();
  const contacts = useUserContacts(account?.pubkey);
  const relays = useReadRelays();
  const authors = useMemo(
    () => (account ? [account.pubkey, ...(contacts ?? []).map((contact) => contact.pubkey)] : undefined),
    [account?.pubkey, contacts],
  );
  const { loader, timeline: recommendations } = useTimelineLoader(
    `${account?.pubkey}-git-repository-handlers`,
    relays,
    authors ? getAppRecommendationsFilter(GIT_REPOSITORY_KIND, authors) : undefined,
  );

  useEffect(() => {
    const sub = loader?.({ since: 0, until: Math.floor(Date.now() / 1000) }).subscribe();
    return () => sub?.unsubscribe();
  }, [loader]);

  return useMemo(() => {
    const own = recommendations.find((recommendation) => recommendation.pubkey === account?.pubkey);
    const ownHandler = own && getWebHandlers(own)[0];
    if (ownHandler) return ownHandler.pointer;

    const tally = new Map<string, { pointer: AddressPointer; count: number }>();
    for (const recommendation of recommendations) {
      for (const { pointer } of getWebHandlers(recommendation)) {
        const address = getReplaceableAddressFromPointer(pointer);
        const entry = tally.get(address) ?? { pointer, count: 0 };
        entry.count++;
        tally.set(address, entry);
      }
    }
    return Array.from(tally.values()).sort((a, b) => b.count - a.count)[0]?.pointer;
  }, [recommendations, account?.pubkey]);
}

function RepositoryHandlerButton({ source, ...props }: { source: NostrRepositoryUri } & Omit<ButtonProps, "children">) {
  const identity = useDnsIdentity(source.nip05);
  const pubkey = source.pubkey ?? (identity?.status === IdentityStatus.Found ? identity.pubkey : undefined);

  const handler = useReplaceableEvent(useRecommendedRepositoryHandler());

  const link = useMemo(() => {
    if (!pubkey || !handler) return undefined;
    const repository = { kind: GIT_REPOSITORY_KIND, pubkey, identifier: source.identifier, relays: source.relays };
    return createHandlerAddressLink(handler, repository);
  }, [source, pubkey, handler]);

  if (!link || !handler) return null;
  return (
    <Button as={Link} href={link} isExternal variant="outline" {...props}>
      Open in {getHandlerName(handler)}
    </Button>
  );
}

/** Opens a napplet's NIP-34 `source` repository in the user's recommended git client */
export default function NappletSourceButton({
  event,
  ...props
}: { event: NostrEvent } & Omit<ButtonProps, "children">) {
  const source = useMemo(() => {
    const value = getNappletSource(event);
    return value ? parseNostrRepositoryUri(value) : undefined;
  }, [event]);

  if (!source) return null;
  return <RepositoryHandlerButton source={source} {...props} />;
}
