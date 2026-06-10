/**
 * Display a timeline of zaps (Lightning payments) with amounts and recipients
 * @tags nip-57, zap, timeline, lightning
 * @related zap/graph, nutzap/zap-feed
 */
import { castUser, User, Zap } from "applesauce-common/casts";
import { castTimelineStream } from "applesauce-common/observable";
import type { Link } from "applesauce-content/nast";
import { EventStore, mapEventsToStore } from "applesauce-core";
import { isAudioURL, isImageURL, isVideoURL, kinds } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { ComponentMap, use$, useRenderedContent } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { useState } from "react";

import RelayPicker from "../../components/relay-picker";

// Setup event store
const eventStore = new EventStore();
const pool = new RelayPool();

// Create unified event loader for the store
// This will be called if the event store doesn't have the requested event
createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es/", "wss://index.hzrd149.com", "wss://indexer.coracle.social"],
});

function LinkRenderer({ node: link }: { node: Link }) {
  if (isImageURL(link.href))
    return (
      <a href={link.href} target="_blank">
        <img src={link.href} className="max-h-64 rounded" alt="" />
      </a>
    );
  if (isVideoURL(link.href)) return <video src={link.href} className="max-h-64 rounded" controls />;
  if (isAudioURL(link.href)) return <audio src={link.href} className="rounded" controls />;
  return (
    <a href={link.href} target="_blank" className="text-blue-500 hover:underline">
      {link.value}
    </a>
  );
}

/** Renders the zap request content using the same renderers as the notes/rendering example. */
const components: ComponentMap = {
  text: ({ node }) => <span>{node.value}</span>,
  link: LinkRenderer,
  mention: ({ node }) => (
    <a href={`https://njump.me/${node.encoded}`} target="_blank" className="text-purple-500 hover:underline">
      @{node.encoded.slice(0, 8)}...
    </a>
  ),
  hashtag: ({ node }) => <span className="text-orange-500">#{node.hashtag}</span>,
  emoji: ({ node }) => <img title={node.raw} src={node.url} className="w-6 h-6 inline align-text-bottom" />,
};

/** A component for rendering user avatars */
function Avatar({ user }: { user: User }) {
  const profile = use$(user.profile$);

  return (
    <div className="avatar">
      <div className="w-8 rounded-full">
        <img src={profile?.picture ?? `https://robohash.org/${user.pubkey}.png`} />
      </div>
    </div>
  );
}

/** A component for rendering usernames */
function Username({ user }: { user: User }) {
  const profile = use$(user.profile$);
  return <>{profile?.displayName ?? profile?.name ?? "unknown"}</>;
}

function ZapEvent({ zap }: { zap: Zap }) {
  const amount = Math.round(zap.amount / 1000); // Convert msats to sats
  const addressPointer = zap.addressPointer ?? undefined;
  const eventPointer = zap.eventPointer ?? undefined;
  const isProfileZap = !addressPointer && !eventPointer;
  const zappedEvent = use$(zap.event$);

  // The zap message lives on the zap request (kind 9734) embedded in the receipt.
  const message = zap.request.content.trim();
  const renderedMessage = useRenderedContent(zap.request, components);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-center">
        <Avatar user={zap.sender} />
        <h2>
          <span className="font-bold">
            <Username user={zap.sender} />
          </span>
          <span> zapped </span>
          {isProfileZap && (
            <>
              <span className="font-bold">
                <Username user={zap.recipient} />
              </span>{" "}
            </>
          )}
          <span className="text-warning font-bold">{amount} sats</span>
        </h2>
        <time className="ms-auto text-sm text-gray-500">{new Date(zap.event.created_at * 1000).toLocaleString()}</time>
      </div>

      {message && (
        <div className="whitespace-pre-wrap border-l-4 border-warning ps-3 py-1 text-sm">{renderedMessage}</div>
      )}

      {isProfileZap ? (
        <div className="card card-sm bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex items-center gap-4">
              <Avatar user={zap.recipient} />
              <div className="flex flex-col">
                <h2 className="card-title">
                  <Username user={zap.recipient} />
                </h2>
                <span className="text-xs text-gray-500">Profile zap</span>
              </div>
            </div>
          </div>
        </div>
      ) : zappedEvent ? (
        <div className="card card-sm bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex items-center gap-4">
              <Avatar user={castUser(zappedEvent.pubkey, eventStore)} />
              <h2 className="card-title">
                <Username user={castUser(zappedEvent.pubkey, eventStore)} />
              </h2>
            </div>
            <p>{zappedEvent.content}</p>
          </div>
        </div>
      ) : addressPointer ? (
        <div className="card card-sm bg-base-200 shadow-md opacity-50">
          <div className="card-body">
            <div className="flex items-center gap-4">
              <span className="loading loading-dots loading-lg" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-mono">
                  Loading address: {addressPointer.kind}:{addressPointer.pubkey.slice(0, 8)}…:
                  {addressPointer.identifier}
                </p>
                {addressPointer.relays && addressPointer.relays.length > 0 && (
                  <p className="text-xs text-gray-500">Checking relays: {addressPointer.relays.join(", ")}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card card-sm bg-base-200 shadow-md opacity-50">
          <div className="card-body">
            <div className="flex items-center gap-4">
              <span className="loading loading-dots loading-lg" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-mono">Loading event: {eventPointer!.id}</p>
                {eventPointer!.relays && eventPointer!.relays.length > 0 && (
                  <p className="text-xs text-gray-500">Checking relays: {eventPointer!.relays.join(", ")}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ZapsTimeline() {
  const [relay, setRelay] = useState<string>("wss://relay.primal.net/");

  use$(
    () =>
      pool
        .relay(relay)
        .subscription({ kinds: [kinds.Zap], limit: 100 }, { reconnect: true })
        .pipe(mapEventsToStore(eventStore)),
    [relay],
  );

  const zaps = use$(() => eventStore.timeline({ kinds: [kinds.Zap] }).pipe(castTimelineStream(Zap, eventStore)), []);

  return (
    <div className="container mx-auto p-2 h-full max-w-4xl">
      <div className="flex gap-2 mb-4">
        <RelayPicker value={relay} onChange={setRelay} />
      </div>

      <div className="flex flex-col gap-4">
        {zaps?.map((zap) => (
          <ZapEvent key={zap.event.id} zap={zap} />
        ))}
      </div>
    </div>
  );
}
