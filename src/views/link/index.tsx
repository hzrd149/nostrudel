import { Alert, AlertIcon, AlertTitle, Spinner } from "@chakra-ui/react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Kind, nip19 } from "nostr-tools";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import useSingleEvent from "../../hooks/use-single-event";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { EventPointer, ProfilePointer } from "nostr-tools/lib/nip19";

export function NpubLinkHandler({ pubkey, relays }: { pubkey: string; relays?: string[] }) {
  const readRelays = useReadRelayUrls(relays);
  const metadata = useUserMetadata(pubkey, readRelays);
  if (!metadata) return <Spinner />;
  return <Navigate to={`/u/${pubkey}`} replace />;
}

export function NoteLinkHandler({ eventId, relays }: { eventId: string; relays?: string[] }) {
  const readRelays = useReadRelayUrls(relays);
  const { event, loading } = useSingleEvent(eventId, readRelays);
  if (loading) return <Spinner />;

  if (!event)
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Failed to find event</AlertTitle>
      </Alert>
    );

  if (event.kind !== Kind.Text)
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Cant handle event kind {event.kind}</AlertTitle>
      </Alert>
    );

  return <Navigate to={`/n/${eventId}`} replace />;
}

export default function NostrLinkView() {
  const [searchParams] = useSearchParams();
  const rawLink = searchParams.get("q");

  if (!rawLink)
    return (
      <Alert status="warning">
        <AlertIcon />
        <AlertTitle>No link provided</AlertTitle>
      </Alert>
    );

  const cleanLink = rawLink.replace(/(web\+)?nostr:/, "");
  const decoded = nip19.decode(cleanLink);

  if (decoded.type === "npub") return <NpubLinkHandler pubkey={decoded.data as string} />;
  if (decoded.type === "nprofile") {
    const data = decoded.data as ProfilePointer;
    return <NpubLinkHandler pubkey={data.pubkey} relays={data.relays} />;
  }
  if (decoded.type === "note") return <NoteLinkHandler eventId={decoded.data as string} />;
  if (decoded.type === "nevent") {
    const data = decoded.data as EventPointer;
    return <NoteLinkHandler eventId={data.id} relays={data.relays} />;
  }

  return (
    <Alert status="warning">
      <AlertIcon />
      <AlertTitle>Unknown type "{decoded.type}"</AlertTitle>
    </Alert>
  );
}
