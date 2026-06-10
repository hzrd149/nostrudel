/**
 * Simple note composer using a plain textarea with a live content preview toggle.
 * Supports uploading files to the user's configured blossom servers.
 * @tags nip-01, nip-65, compose, preview, rendering, blossom, file-upload
 * @related notes/composing, notes/rendering, blossom/server-manager
 */
import { castUser, User } from "applesauce-common/casts";
import { NoteFactory } from "applesauce-common/factories";
import { Link } from "applesauce-content/nast";
import "applesauce-content/text/cashu";
import "applesauce-content/text/lightning";
import { EventStore } from "applesauce-core";
import { isAudioURL, isImageURL, isVideoURL, relaySet } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { ComponentMap, use$, useRenderedContent } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import type { ISigner } from "applesauce-signers";
import { multiServerMediaUpload, multiServerUpload } from "blossom-client-sdk/actions/multi-server";
import { createUploadAuth } from "blossom-client-sdk/auth";
import { nip19 } from "nostr-tools";
import { useCallback, useMemo, useRef, useState } from "react";
import { BehaviorSubject, map } from "rxjs";

import LoginView from "../../components/login-view";

const FALLBACK_RELAYS = ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"];
const LOOKUP_RELAYS = ["wss://purplepag.es", "wss://index.hzrd149.com"];

const eventStore = new EventStore();
const pool = new RelayPool();

createEventLoaderForStore(eventStore, pool, {
  lookupRelays: LOOKUP_RELAYS,
  extraRelays: FALLBACK_RELAYS,
});

const signer$ = new BehaviorSubject<ISigner | null>(null);
const pubkey$ = new BehaviorSubject<string | null>(null);
const user$ = pubkey$.pipe(map((p) => (p ? castUser(p, eventStore) : undefined)));

const DEFAULT_BLOSSOM_SERVERS = [new URL("https://blossom.primal.net")];

/** Upload a file to the user's blossom servers and return the URL */
async function uploadToBlossom(
  file: File,
  signer: ISigner,
  blossomServers: URL[] | undefined,
  useMediaOptimization: boolean,
): Promise<string> {
  const servers = blossomServers?.length ? blossomServers : DEFAULT_BLOSSOM_SERVERS;
  const isImageOrVideo = file.type.startsWith("image/") || file.type.startsWith("video/");
  const isMedia = useMediaOptimization && isImageOrVideo;

  const results = await (isMedia ? multiServerMediaUpload : multiServerUpload)(servers, file, {
    onAuth: (_server, sha256, type) => createUploadAuth((draft) => signer.signEvent(draft), sha256, { type }),
  });

  const [, blob] = results.entries().next().value!;
  return blob.url;
}

/** Favicon avatar for a server URL */
function ServerFavicon({ url, size = "w-6 h-6" }: { url: string; size?: string }) {
  const [error, setError] = useState(false);

  let hostname: string;
  let faviconUrl: string;
  try {
    const parsed = new URL(url.replace(/^wss:\/\//, "https://").replace(/^ws:\/\//, "http://"));
    hostname = parsed.hostname;
    faviconUrl = new URL("/favicon.ico", parsed).href;
  } catch {
    hostname = url;
    faviconUrl = "";
  }

  if (error || !faviconUrl) {
    return (
      <div
        className={`${size} rounded-full bg-base-200 flex items-center justify-center text-[10px] font-bold`}
        title={hostname}
      >
        {hostname[0]?.toUpperCase() ?? "?"}
      </div>
    );
  }

  return (
    <img
      src={faviconUrl}
      alt={hostname}
      title={hostname}
      className={`${size} rounded-full bg-base-200`}
      onError={() => setError(true)}
    />
  );
}

/** Avatar stack showing servers */
function AvatarStack({ urls }: { urls: string[] }) {
  return (
    <div className="flex -space-x-2">
      {urls.map((url) => (
        <div key={url} className="ring-2 ring-base-100 rounded-full">
          <ServerFavicon url={url} />
        </div>
      ))}
    </div>
  );
}

// Reuse the same component map from the rendering example
function LinkRenderer({ node: link }: { node: Link }) {
  if (isImageURL(link.href))
    return (
      <a href={link.href} target="_blank">
        <img src={link.href} className="max-h-64 rounded" alt="" />
      </a>
    );
  else if (isVideoURL(link.href)) return <video src={link.href} className="max-h-64 rounded" controls />;
  else if (isAudioURL(link.href)) return <audio src={link.href} className="max-h-64 rounded" controls />;
  else
    return (
      <a href={link.href} target="_blank" className="text-blue-500 hover:underline">
        {link.value}
      </a>
    );
}

const components: ComponentMap = {
  text: ({ node }) => <span>{node.value}</span>,
  link: LinkRenderer,
  mention: ({ node }) => (
    <a href={`https://njump.me/${node.encoded}`} target="_blank" className="text-purple-500 hover:underline">
      @{node.encoded.slice(0, 12)}...
    </a>
  ),
  hashtag: ({ node }) => <span className="text-orange-500">#{node.hashtag}</span>,
  emoji: ({ node }) => <img title={node.raw} src={node.url} className="w-6 h-6 inline" />,
  cashu: ({ node }) => (
    <span className="text-pink-500">
      {node.raw.slice(0, 10)}...{node.raw.slice(-5)}
    </span>
  ),
  lightning: ({ node }) => (
    <span className="text-yellow-400">
      {node.invoice.slice(0, 10)}...{node.invoice.slice(-5)}
    </span>
  ),
};

/** Preview rendered content from a plain text string */
function NotePreview({ content }: { content: string }) {
  const rendered = useRenderedContent(content || undefined, components);

  if (!content.trim()) {
    return <p className="text-base-content/40 italic">Start typing to see a preview...</p>;
  }

  return <div className="whitespace-pre-wrap">{rendered}</div>;
}

function Composer({ user, signer }: { user: User; signer: ISigner }) {
  const [content, setContent] = useState("");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mediaOptimization, setMediaOptimization] = useState(true);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [published, setPublished] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mailboxes = use$(() => user.mailboxes$, [user.pubkey]);
  const blossomServers = use$(() => user.blossomServers$, [user.pubkey]);
  const publishRelays = useMemo(
    () => (mailboxes?.outboxes?.length ? relaySet(FALLBACK_RELAYS, mailboxes.outboxes) : FALLBACK_RELAYS),
    [mailboxes],
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;

      setUploading(true);
      setPublishError(null);
      try {
        const urls: string[] = [];
        for (const file of files) {
          const url = await uploadToBlossom(file, signer, blossomServers, mediaOptimization);
          urls.push(url);
        }

        // Insert URLs at cursor position or end
        const textarea = textareaRef.current;
        const insertText = urls.join("\n");
        if (textarea) {
          const pos = textarea.selectionStart ?? content.length;
          const before = content.slice(0, pos);
          const after = content.slice(pos);
          const sep = before.length && !before.endsWith("\n") ? "\n" : "";
          setContent(before + sep + insertText + (after.startsWith("\n") ? "" : "\n") + after);
        } else {
          setContent((prev) => (prev ? prev + "\n" + insertText : insertText));
        }
      } catch (err) {
        setPublishError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [content, signer, blossomServers, mediaOptimization],
  );

  const handlePublish = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed) return;

    setPublishing(true);
    setPublishError(null);
    try {
      const signed = await NoteFactory.create(trimmed).sign(signer);
      await pool.publish(publishRelays, signed);
      eventStore.add(signed);
      setPublished(true);
      setContent("");
      setTab("write");
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }, [content, publishRelays, signer]);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Simple Composer</h1>
        <span className="text-sm text-base-content/60 font-mono">{nip19.npubEncode(user.pubkey).slice(0, 16)}...</span>
      </div>
      <p className="text-base-content/70 text-sm">
        Write a kind 1 note in the textarea. Toggle to preview to see how mentions, links, hashtags, and media will
        render. The note is built with <code className="text-xs bg-base-200 px-1 rounded">NoteFactory</code> which
        automatically creates the appropriate tags.
      </p>
      <label className="flex flex-wrap items-center gap-2 cursor-pointer text-sm text-base-content/80 w-fit">
        <input
          type="checkbox"
          className="toggle toggle-sm"
          checked={mediaOptimization}
          onChange={() => setMediaOptimization((v) => !v)}
        />
        <span>
          Media optimization <span className="text-base-content/50">(BUD-05 /media when the server supports it)</span>
        </span>
      </label>

      {/* Tabs */}
      <div role="tablist" className="tabs tabs-bordered">
        <button
          role="tab"
          type="button"
          className={`tab ${tab === "write" ? "tab-active" : ""}`}
          onClick={() => setTab("write")}
        >
          Write
        </button>
        <button
          role="tab"
          type="button"
          className={`tab ${tab === "preview" ? "tab-active" : ""}`}
          onClick={() => setTab("preview")}
        >
          Preview
        </button>
      </div>

      {/* Content area */}
      {tab === "write" ? (
        <textarea
          ref={textareaRef}
          className="w-full min-h-[220px] border border-base-300 rounded-lg bg-base-100 p-4 outline-none resize-y text-base leading-relaxed"
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setPublished(false);
          }}
        />
      ) : (
        <div className="border border-base-300 rounded-lg bg-base-100 p-4 min-h-[220px]">
          <NotePreview content={content} />
        </div>
      )}

      {publishError && <div className="text-error text-sm">{publishError}</div>}
      {published && <div className="text-success text-sm">Note published successfully!</div>}

      {/* Footer */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        className="hidden"
        onChange={handleFileSelect}
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <span className="loading loading-spinner loading-sm" /> : "Attach file"}
          </button>
          <AvatarStack urls={(blossomServers ?? DEFAULT_BLOSSOM_SERVERS).map((s) => s.href)} />
        </div>
        <div className="flex items-center gap-3">
          <AvatarStack urls={publishRelays} />
          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePublish}
            disabled={publishing || !content.trim()}
          >
            {publishing ? <span className="loading loading-spinner loading-sm" /> : "Publish"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SimpleComposerExample() {
  const signer = use$(signer$);
  const pubkey = use$(pubkey$);
  const user = use$(user$);

  if (!signer || !pubkey || !user) {
    return (
      <LoginView
        onLogin={(s, pk) => {
          signer$.next(s);
          pubkey$.next(pk);
        }}
      />
    );
  }

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <Composer user={user} signer={signer} />
    </div>
  );
}
