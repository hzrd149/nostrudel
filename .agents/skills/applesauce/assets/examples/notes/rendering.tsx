/**
 * Render simple text notes with basic formatting, media detection, and image galleries.
 * Uses blossom-client-sdk `handleBrokenMedia` so img/video/audio under each note (including galleries)
 * get blossom server fallbacks when URLs fail or `blossom:` cannot load directly.
 * @tags nip-27, nip-96, content, text, rendering, blossom
 * @related content/articles, feed/algorithmic-relay
 */
import { Note } from "applesauce-common/casts";
import "applesauce-common/models";
import { castTimelineStream } from "applesauce-common/observable";
import type { BlossomURI, Gallery, Link } from "applesauce-content/nast";
import { defined, EventStore, mapEventsToStore } from "applesauce-core";
import { isAudioURL, isImageURL, isStreamURL, isVideoURL } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { ComponentMap, use$, useRenderedContent } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import { Actions, handleBrokenMedia } from "blossom-client-sdk";
import { createBlossomHlsLoaders } from "blossom-client-sdk/hls";
import Hls from "hls.js";
import { decode, EventPointer } from "nostr-tools/nip19";
import { Blurhash } from "react-blurhash";
import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { firstValueFrom, merge, take, timeout } from "rxjs";

// Export extra token types to parse
import "applesauce-content/text/cashu";
import "applesauce-content/text/imeta";
import "applesauce-content/text/lightning";

import RelayPicker from "../../components/relay-picker";

const eventStore = new EventStore();
const pool = new RelayPool();

const NoteAuthorPubkeyContext = createContext<string | undefined>(undefined);

function useNoteAuthorPubkey() {
  return useContext(NoteAuthorPubkeyContext);
}

type HlsBlossomStreamProps = {
  src: string;
  className?: string;
  authorPubkey?: string;
  blossomAuthorPubkey?: string;
  getServersForPubkey?: (pubkey: string) => Promise<(string | URL)[] | undefined>;
};

function HlsBlossomStream({
  src,
  className,
  authorPubkey,
  blossomAuthorPubkey,
  getServersForPubkey,
}: HlsBlossomStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | undefined;
    let cancelled = false;

    void (async () => {
      let primary: string;
      let fallbackServers: (string | URL)[] = [];

      if (src.startsWith("blossom:")) {
        const hintPubkey = blossomAuthorPubkey || authorPubkey;
        const extraFallbacks = hintPubkey && getServersForPubkey ? ((await getServersForPubkey(hintPubkey)) ?? []) : [];

        const urls = await Actions.getBlobUrls(src, {
          getServers: getServersForPubkey ? async (pubkey: string) => getServersForPubkey(pubkey) : undefined,
          fallbackServers: extraFallbacks.length ? extraFallbacks : undefined,
        });
        if (cancelled) return;
        if (!urls.length) return;

        primary = urls[0];
        fallbackServers = urls.slice(1);
      } else {
        primary = src;
      }

      if (cancelled) return;

      const { pLoader, fLoader } = createBlossomHlsLoaders({
        fallbackServers,
        stickyFailover: true,
      });

      if (cancelled) return;

      if (Hls.isSupported()) {
        hls = new Hls({ pLoader, fLoader });
        hls.loadSource(primary);
        hls.attachMedia(video);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = primary;
      }
    })();

    return () => {
      cancelled = true;
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [src, authorPubkey, blossomAuthorPubkey, getServersForPubkey]);

  return <video ref={videoRef} className={className} controls playsInline />;
}

/** Resolves NIP-96 blossom servers for any pubkey (used when HTTP blob URLs or blossom `as=` hints need fallbacks). */
async function getBlossomServersForPubkey(pubkey?: string) {
  if (!pubkey) return undefined;
  return firstValueFrom(eventStore.blossomServers({ pubkey }).pipe(defined(), take(1), timeout(5000)));
}

/**
 * Scales a NIP-94 `dim` value (e.g. `"800x600"`) to fit within `maxW`/`maxH` while preserving
 * aspect ratio. Returns intrinsic pixel dimensions so the placeholder occupies the same box
 * the real `<img>`/`<video>` would once loaded.
 */
function fitMediaDimensions(dim: string | undefined, maxW = 384, maxH = 256) {
  if (!dim) return undefined;
  const match = dim.match(/^(\d+)x(\d+)$/);
  if (!match) return undefined;
  const w = parseInt(match[1], 10);
  const h = parseInt(match[2], 10);
  if (!w || !h) return undefined;
  const scale = Math.min(maxW / w, maxH / h, 1);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

/** A blurhash placeholder button — clicking calls `onReveal` to swap in the real media element. */
function BlurhashPlaceholder({
  blurhash,
  dim,
  label,
  onReveal,
}: {
  blurhash: string;
  dim?: string;
  label: string;
  onReveal: () => void;
}) {
  const size = fitMediaDimensions(dim);
  const style: CSSProperties = size
    ? { width: size.width, height: size.height, maxWidth: "100%" }
    : { width: 192, height: 192 };
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onReveal();
      }}
      aria-label={label}
      className="relative block overflow-hidden rounded cursor-pointer"
      style={style}
    >
      <Blurhash hash={blurhash} width="100%" height="100%" punch={1} />
      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white drop-shadow">
        {label}
      </span>
    </button>
  );
}

/** Renders a blurhash placeholder first; on click, swaps in the real `<img>`. */
function BlurhashImage({ src, blurhash, dim, alt }: { src: string; blurhash?: string; dim?: string; alt?: string }) {
  const [revealed, setRevealed] = useState(!blurhash);
  if (!revealed && blurhash)
    return (
      <BlurhashPlaceholder blurhash={blurhash} dim={dim} label="Tap to load image" onReveal={() => setRevealed(true)} />
    );
  return <img src={src} alt={alt ?? "Image"} loading="lazy" className="max-h-64 rounded" />;
}

/** Renders a blurhash placeholder first; on click, swaps in the real `<video>` element. */
function BlurhashVideo({
  src,
  blurhash,
  dim,
  poster,
}: {
  src: string;
  blurhash?: string;
  dim?: string;
  poster?: string;
}) {
  const [revealed, setRevealed] = useState(!blurhash);
  if (!revealed && blurhash)
    return (
      <BlurhashPlaceholder blurhash={blurhash} dim={dim} label="Tap to load video" onReveal={() => setRevealed(true)} />
    );
  return <video src={src} poster={poster} className="max-h-64 rounded" controls playsInline autoPlay={!!blurhash} />;
}

function LinkRenderer({ node: link }: { node: Link }) {
  const authorPubkey = useNoteAuthorPubkey();
  if (isStreamURL(link.href))
    return (
      <HlsBlossomStream
        src={link.href}
        className="max-h-64 rounded w-full"
        authorPubkey={authorPubkey}
        getServersForPubkey={getBlossomServersForPubkey}
      />
    );
  if (isImageURL(link.href))
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer">
        <BlurhashImage
          src={link.href}
          blurhash={link.metadata?.blurhash}
          dim={link.metadata?.dimensions}
          alt={link.metadata?.alt}
        />
      </a>
    );
  else if (isVideoURL(link.href))
    return (
      <BlurhashVideo
        src={link.href}
        blurhash={link.metadata?.blurhash}
        dim={link.metadata?.dimensions}
        poster={link.metadata?.thumbnail || link.metadata?.image}
      />
    );
  else if (isAudioURL(link.href)) return <audio src={link.href} className="max-h-64 rounded" controls />;
  else
    return (
      <a href={link.href} target="_blank" className="text-blue-500 hover:underline">
        {link.value}
      </a>
    );
}

function BlossomRenderer({ node }: { node: BlossomURI }) {
  const authorPubkey = useNoteAuthorPubkey();
  const probe = new URL(`https://example.com/x.${node.ext}`);
  let inner: ReactNode;
  if (isImageURL(probe)) inner = <img src={node.raw} className="max-h-64 rounded" alt="Blossom image" />;
  else if (isStreamURL(probe))
    inner = (
      <HlsBlossomStream
        src={node.raw}
        className="max-h-64 rounded w-full"
        authorPubkey={authorPubkey}
        blossomAuthorPubkey={node.authors[0]}
        getServersForPubkey={getBlossomServersForPubkey}
      />
    );
  else if (isVideoURL(probe)) inner = <video src={node.raw} className="max-h-64 rounded" controls />;
  else if (isAudioURL(probe)) inner = <audio src={node.raw} className="max-h-64 rounded" controls />;
  else inner = <span className="text-sm text-base-content/70">{node.raw}</span>;
  return inner;
}

/** Adjacent image links and blossom image URIs are merged into a gallery by the text parser; `links` are full hrefs (`https://…` or `blossom:…`). */
function GalleryRenderer({ node }: { node: Gallery }) {
  return (
    <div className="flex flex-nowrap gap-2 my-2 min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain">
      {node.links.map((href, i) => (
        <a
          key={`${href}-${i}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block shrink-0 max-w-[min(100%,20rem)] border border-base-300 rounded overflow-hidden"
        >
          <img
            src={href}
            className="max-h-64 w-full h-auto object-contain"
            alt={`Gallery image ${i + 1}`}
            loading="lazy"
          />
        </a>
      ))}
    </div>
  );
}

const components: ComponentMap = {
  text: ({ node }) => <span>{node.value}</span>,
  link: LinkRenderer,
  blossom: BlossomRenderer,
  gallery: GalleryRenderer,
  mention: ({ node }) => (
    <a href={`https://njump.me/${node.encoded}`} target="_blank" className="text-purple-500 hover:underline">
      @{node.encoded.slice(0, 8)}...
    </a>
  ),
  hashtag: ({ node }) => <span className="text-orange-500">#{node.hashtag}</span>,
  emoji: ({ node }) => (
    <span className="text-green-500">
      <img title={node.raw} src={node.url} className="w-6 h-6 inline" /> {node.raw}
    </span>
  ),
  cashu: ({ node }) => (
    <span className="text-pink-500">
      @{node.raw.slice(0, 10)}...{node.raw.slice(-5)}
    </span>
  ),
  lightning: ({ node }) => (
    <span className="text-yellow-400">
      {node.invoice.slice(0, 10)}...{node.invoice.slice(-5)}
    </span>
  ),
};

const eventLoader = createEventLoaderForStore(eventStore, pool, {
  extraRelays: ["wss://relay.damus.io", "wss://nos.lol"],
  lookupRelays: ["wss://purplepag.es", "wss://index.hzrd149.com"],
});

const examples: EventPointer[] = [
  "nevent1qvzqqqqqqypzqfngzhsvjggdlgeycm96x4emzjlwf8dyyzdfg4hefp89zpkdgz99qy2hwumn8ghj7un9d3shjtnyv9kh2uewd9hj7qg3waehxw309ahx7um5wgh8w6twv5hsqgqtlsc3aun67vuehq8uun4fmsqy4r7tnemg05c7p7f0tryma5e42cdyfdnq",
  "nevent1qvzqqqqqqypzqxh4f92ex6lgqnu4qyry06j6mfw8vfldmurnfflczwa6pcc7aktqqy2hwumn8ghj7mn0wd68ytn00p68ytnyv4mz7qg4waehxw309aex2mrp0yhxgctdw4eju6t09uqzq5uj68wa0cgqwak43wtalf35ypclethsmmmrnn7u926fwwpy9fw58geyf6",
  "nostr:nevent1qvzqqqqqqypzqfngzhsvjggdlgeycm96x4emzjlwf8dyyzdfg4hefp89zpkdgz99qy2hwumn8ghj7un9d3shjtnyv9kh2uewd9hj7qg3waehxw309ahx7um5wgh8w6twv5hsqgzvn5uf7uws838qmljmlfl7mpll82tvwrnkdr8t0nn9j3zgmvtwvvmf8c6g",
  "nostr:nevent1qvzqqqqqqypzph4t08d058ptuj62d5av5y6hkm92pd6yhar26556ttjxg2y908ngqyghwumn8ghj7mn0wd68ytnhd9hx2tcpzemhxue69uhkummnw3ex2mrfw3jhxtn0wfnj7qpqd4hr5dshxsyv3axesxc0cekyw9w6n6wkclfy3h8x5f9vw7nzuvfs55ax0x",
  "nevent1qqsfhafvv705g5wt8rcaytkj6shsshw3dwgamgfe3za8knk0uq4yesgpzpmhxue69uhkummnw3ezuamfdejszrthwden5te0dehhxtnvdakqsrnltk",
  "nevent1qvzqqqqqqypzp22rfmsktmgpk2rtan7zwu00zuzax5maq5dnsu5g3xxvqr2u3pd7qyghwumn8ghj7mn0wd68ytnhd9hx2tcpzamhxue69uhhyetvv9ujumn0wd68ytnzv9hxgtcqyqtplwkqnp05239mvxmpewhtkhtq3fvljp7kqlxduzvz9pqryhtacxpum48",
  "nostr:nevent1qvzqqqqqqypzqlchwur26ms2af66nce5tk0lmtn8vah6lujfhejhkktrwhsua5u3qyw8wumn8ghj7un9d3shjtnzd96xxmmfdecxzunt9e3k7mf0qyd8wumn8ghj7um9dejxjapwdehhxenvv9ex2tnrdakj7qpqt4cvpzntvc6cqxz28220fqshttgwlnyqf0k4vaen4ff9elu8gq6qhxzmxa",
  "nevent1qvzqqqqqqypzqwlsccluhy6xxsr6l9a9uhhxf75g85g8a709tprjcn4e42h053vaqyd8wumn8ghj7mr0vd4kymmc9enxjct5dfskvtnrdakj7qg4waehxw309aex2mrp0yhxgctdw4eju6t09uqzp3s3dg4pxlncurwnslqxxxskq7z8ys3j8wfr9m5s9ufspka3jfc3tq9y28",
  "nevent1qvzqqqqqqypzqwlsccluhy6xxsr6l9a9uhhxf75g85g8a709tprjcn4e42h053vaqyd8wumn8ghj7mr0vd4kymmc9enxjct5dfskvtnrdakj7qg4waehxw309aex2mrp0yhxgctdw4eju6t09uqzpawhd8gw3pzl4t923uc5r5wvpd3z6p3argdwz45g0dwd38meqf7k887dps",
  "nevent1qvzqqqqqqypzqwlsccluhy6xxsr6l9a9uhhxf75g85g8a709tprjcn4e42h053vaqyd8wumn8ghj7mr0vd4kymmc9enxjct5dfskvtnrdakj7qg4waehxw309aex2mrp0yhxgctdw4eju6t09uqzpxyres0r4mtyv2jw37fxp2rcc7jqgjagjl7sww5wsmphf5z53az5c0dnzm",
  "nevent1qvzqqqqqqypzqwlsccluhy6xxsr6l9a9uhhxf75g85g8a709tprjcn4e42h053vaqyd8wumn8ghj7mr0vd4kymmc9enxjct5dfskvtnrdakj7qpqu35ew3sp89shfd22ujzuc05jmazgrjzx545f63nt8vc49zltgzsqcx9h9t",
  "nevent1qvzqqqqqqypzqaqc0waan5czxr9ltuxjpavwpq8lp38huc9va7ynrvcgjwd8hdtsqy2hwumn8ghj7un9d3shjtnyv9kh2uewd9hj7qgwwaehxw309ahx7uewd3hkctcqypd2ejn8dykjp03r0zcwll979v7qyj25ku8hpyxr36ydakjey4dr65pnxfg",
  "nostr:nevent1qvzqqqqqqypzph4t08d058ptuj62d5av5y6hkm92pd6yhar26556ttjxg2y908ngqyghwumn8ghj7mn0wd68ytnhd9hx2tcpzemhxue69uhkummnw3ex2mrfw3jhxtn0wfnj7qpq36lz0w4last9zmvhcwkyfdsp6y7306vsv3xtkhrc69evsaz0fg0s29qhxe",
  "nevent1qvzqqqqqqypzpl0ejdgzyg0rrnvvzcmhyytd5xcefa4rntw4ss6nqd54j3c7ad40qqsqmemkxzgs74w4xt3xlghanaj24hjlpeda2xajzyc4ruxrehk0j7sed8ztc",
  "nevent1qvzqqqqqqypzqfngzhsvjggdlgeycm96x4emzjlwf8dyyzdfg4hefp89zpkdgz99qyf8wumn8ghj7mn0wd68yat99e3k7mf0qy2hwumn8ghj7un9d3shjtnyv9kh2uewd9hj7qpqd29yg6e5y0uyq0ttva728agcjzhxffgnz8a5kqwfrf5njk68yxmqp4mwth",
  "nevent1qvzqqqqqqypzp22rfmsktmgpk2rtan7zwu00zuzax5maq5dnsu5g3xxvqr2u3pd7qyghwumn8ghj7mn0wd68ytnhd9hx2tcpzamhxue69uhhyetvv9ujumn0wd68ytnzv9hxgtcqyznatxwe42lsqutcjafw2v72dtxh0v2w0327m5yh4w3kgwzp0mkx7edh4e6",
  "nevent1qvzqqqqqqypzp978pfzrv6n9xhq5tvenl9e74pklmskh4xw6vxxyp3j8qkke3cezqy2hwumn8ghj7un9d3shjtnyv9kh2uewd9hj7qgwwaehxw309ahx7uewd3hkctcqyzzw77p395ld4zgamuswcd9rj452hewfdmaqp5nynedakztl96h57r9u6r3",
  "nevent1qvzqqqqqqypzps0x2pwq9k5drv99k0tdkmsekt4j9hx4fu8gvvrwez3p8yptx9t7qyg8wumn8ghj77npwqh8wct5vd5z7qgewaehxw309aex2mrp0yhx6mmddaehgu3wwp5ku6e0qqsggwu4a0aczytdg8p69v4w2ua66gaqh387mgmvhnd6gdmx0qsku6g2vz43x",
  "nevent1qvzqqqqqqypzp022u0n8u2vkf4y5zu3xrhz989wgna4a9em5vshrvcf8zuwlhq04qy2hwumn8ghj7un9d3shjtnyv9kh2uewd9hj7qghwaehxw309aex2mrp0yh8qunfd4skctnwv46z7qpq9dn29mvp39q48fawujfxrnrhjtsm3wf4y0nvdjdwea4h9ykxzxpsamhr4l",
  "nevent1qvzqqqqqqypzqfngzhsvjggdlgeycm96x4emzjlwf8dyyzdfg4hefp89zpkdgz99qyf8wumn8ghj7mn0wd68yat99e3k7mf0qy2hwumn8ghj7un9d3shjtnyv9kh2uewd9hj7qpqw9tjg79fycymqv9ppzksk6fmafpw9tzlsy7sqckvxd5ggqpy49as5x0yxh",
  "nevent1qvzqqqqqqypzqfngzhsvjggdlgeycm96x4emzjlwf8dyyzdfg4hefp89zpkdgz99qyf8wumn8ghj7mn0wd68yat99e3k7mf0qy2hwumn8ghj7un9d3shjtnyv9kh2uewd9hj7qpqgwjv0apdkf8u583ktddtnrwenlahrcm3yq9qujdxmyfc2mtf64squlvysu",
  "nevent1qvzqqqqqqypzpmnw5yatnljuff5w47d35d87q99xddqpzlzsac4xzn6vm22ekmn5qy2hwumn8ghj7un9d3shjtnyv9kh2uewd9hj7qghwaehxw309aex2mrp0yh8qunfd4skctnwv46z7qpqsawl5hw6rjhmzv74ydzajevrq4vqgkqq7cugwavlwpsy628hyrpqa7vu8w",
].map((nevent) => decode(nevent.replace(/^nostr:/, "")).data as EventPointer);

function NoteCard({ note }: { note: Note }) {
  const author = note.author;
  const profile = use$(author.profile$);
  const content = useRenderedContent(note.event, components);
  const cardRef = useRef<HTMLDivElement>(null);

  use$(() => eventStore.blossomServers({ pubkey: author.pubkey }), [author.pubkey]);

  useEffect(() => {
    const root = cardRef.current;
    if (!root) return;
    return handleBrokenMedia(root, getBlossomServersForPubkey);
  }, []);

  return (
    <NoteAuthorPubkeyContext.Provider value={author.pubkey}>
      <div ref={cardRef} data-pubkey={author.pubkey} className="p-4 border border-base-300 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img src={profile?.picture ?? `https://robohash.org/${author.pubkey}.png`} alt="" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold truncate">{profile?.displayName || author.npub.slice(0, 8)}</div>
            <div className="text-xs text-base-content/60">{note.createdAt.toLocaleString()}</div>
          </div>
        </div>
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </NoteAuthorPubkeyContext.Provider>
  );
}

export default function ContentRenderingExample() {
  const [relay, setRelay] = useState<string>("");

  use$(() => merge(...examples.map(eventLoader)), []);

  use$(
    () =>
      relay
        ? pool
            .relay(relay)
            .subscription({
              kinds: [1],
              limit: 20,
            })
            .pipe(mapEventsToStore(eventStore))
        : undefined,
    [relay],
  );

  const notes = use$(() => eventStore.timeline({ kinds: [1] }).pipe(castTimelineStream(Note, eventStore)), []);

  return (
    <div className="container mx-auto p-2 h-full">
      <div className="flex gap-2 justify-between">
        <h1 className="text-2xl font-bold mb-4">Content Rendering</h1>
        <RelayPicker value={relay} onChange={setRelay} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {notes?.map((note) => (
          <NoteCard key={note.id} note={note} />
        ))}
      </div>
    </div>
  );
}
