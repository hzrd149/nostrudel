/**
 * Upload a file to the user's blossom servers, build a kind 1063 event, and publish it to outbox relays.
 * @tags nip-94, nip-96, blossom, file-upload, publish, outbox
 * @related file/explorer, notes/simple-composer, blossom/server-manager
 */
import { castEvent, castUser, FileMetadata, User } from "applesauce-common/casts";
import { FileMetadataFactory } from "applesauce-common/factories";
import { EventStore } from "applesauce-core";
import { getDisplayName, getProfilePicture, relaySet, type NostrEvent } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import type { ISigner } from "applesauce-signers";
import { multiServerMediaUpload, multiServerUpload } from "blossom-client-sdk/actions/multi-server";
import { createUploadAuth } from "blossom-client-sdk/auth";
import { nip19 } from "nostr-tools";
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { BehaviorSubject, map } from "rxjs";
import LoginView from "../../components/login-view";

const FALLBACK_RELAYS = ["wss://relay.damus.io", "wss://nos.lol", "wss://relay.primal.net"];
const LOOKUP_RELAYS = ["wss://purplepag.es", "wss://index.hzrd149.com"];
const DEFAULT_BLOSSOM_SERVERS = [new URL("https://blossom.primal.net")];

const eventStore = new EventStore();
const pool = new RelayPool();

createEventLoaderForStore(eventStore, pool, {
  lookupRelays: LOOKUP_RELAYS,
  extraRelays: FALLBACK_RELAYS,
});

const signer$ = new BehaviorSubject<ISigner | null>(null);
const pubkey$ = new BehaviorSubject<string | null>(null);
const user$ = pubkey$.pipe(map((pubkey) => (pubkey ? castUser(pubkey, eventStore) : undefined)));

type UploadResult = {
  file: File;
  metadata: {
    url: string;
    sha256: string;
    size?: number;
    type?: string;
    fallback?: string[];
  };
  publishedURLs: string[];
};

type MetadataFormState = {
  summary: string;
  alt: string;
  thumbnail: string;
  image: string;
  dimensions: string;
  blurhash: string;
};

type UploadStatus = {
  server: string;
  state: "pending" | "uploading" | "uploaded" | "error";
  url?: string;
  message?: string;
};

function formatBytes(size?: number) {
  if (size === undefined || Number.isNaN(size)) return "Unknown size";

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = size;
  let unit = 0;

  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }

  return `${value >= 10 || unit === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
}

async function uploadFileToBlossom(
  file: File,
  signer: ISigner,
  blossomServers: URL[] | undefined,
  useMediaOptimization: boolean,
  hooks?: {
    onStart?: (server: URL) => void;
    onUpload?: (server: URL) => void;
    onError?: (server: URL, error: unknown) => void;
  },
): Promise<UploadResult> {
  const servers = blossomServers?.length ? blossomServers : DEFAULT_BLOSSOM_SERVERS;
  const isImageOrVideo = file.type.startsWith("image/") || file.type.startsWith("video/");
  const isMedia = useMediaOptimization && isImageOrVideo;

  const results = await (isMedia ? multiServerMediaUpload : multiServerUpload)(servers, file, {
    onAuth: (_server, sha256, type) => createUploadAuth((draft) => signer.signEvent(draft), sha256, { type }),
    onStart: (server: URL) => hooks?.onStart?.(server),
    onUpload: (server: URL) => hooks?.onUpload?.(server),
    onError: (server: URL, uploadError: unknown) => hooks?.onError?.(server, uploadError),
  });

  const uploads = Array.from(results.values());
  const primary = uploads[0];
  if (!primary) throw new Error("No upload result returned from blossom server");

  return {
    file,
    metadata: {
      url: primary.url,
      sha256: primary.sha256,
      size: primary.size ?? file.size,
      type: (primary.type ?? file.type) || undefined,
      fallback: uploads.slice(1).map((blob) => blob.url),
    },
    publishedURLs: uploads.map((blob) => blob.url),
  };
}

function ServerFavicon({ server }: { server: URL }) {
  const [error, setError] = useState(false);
  const faviconUrl = new URL("/favicon.ico", server).href;

  if (error) {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded-full border border-base-300 bg-base-200 text-[9px] font-semibold">
        {server.hostname[0]?.toUpperCase() ?? "?"}
      </div>
    );
  }

  return (
    <img
      src={faviconUrl}
      alt={server.hostname}
      title={server.hostname}
      className="h-5 w-5 rounded-full border border-base-300 bg-base-100"
      onError={() => setError(true)}
    />
  );
}

function ServerAvatarStack({ servers }: { servers: URL[] }) {
  return (
    <div className="flex -space-x-2">
      {servers.map((server) => (
        <div key={server.href} className="rounded-full bg-base-100 p-px">
          <ServerFavicon server={server} />
        </div>
      ))}
    </div>
  );
}

function FilePreview({ file, remoteUrl }: { file: File; remoteUrl?: string }) {
  const [localUrl, setLocalUrl] = useState<string>();

  useEffect(() => {
    const next = URL.createObjectURL(file);
    setLocalUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);

  const preview = remoteUrl || localUrl;
  if (!preview) return null;

  if (file.type.startsWith("image/")) {
    return (
      <img src={preview} alt={file.name} className="block max-h-80 w-full max-w-full rounded-2xl object-contain" />
    );
  }

  if (file.type.startsWith("video/")) {
    return <video src={preview} controls className="block max-h-80 w-full max-w-full rounded-2xl object-contain" />;
  }

  if (file.type.startsWith("audio/")) {
    return <audio src={preview} controls className="w-full" />;
  }

  return (
    <div className="flex h-52 items-center justify-center rounded-2xl border border-base-300 bg-base-200 text-sm text-base-content/60">
      {file.type || "Unknown file type"}
    </div>
  );
}

function FileDropZone({ disabled, onSelect }: { disabled?: boolean; onSelect: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const chooseFile = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onSelect(file);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragging(false);
    if (disabled) return;

    const file = event.dataTransfer.files?.[0];
    if (file) onSelect(file);
  };

  return (
    <>
      <input ref={inputRef} type="file" className="hidden" onChange={handleInput} />
      <button
        type="button"
        onClick={chooseFile}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={[
          "flex min-h-[22rem] w-full flex-col items-center justify-center rounded-[2rem] border-2 border-dashed px-8 py-12 text-center transition-colors",
          dragging ? "border-primary bg-primary/10" : "border-base-300 bg-base-100",
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-primary/60",
        ].join(" ")}
      >
        <div className="max-w-xl space-y-4 px-4">
          <div className="text-3xl font-semibold">Drop a file here</div>
          <p className="text-sm text-base-content/70">
            Upload one file to your blossom servers, turn it into a kind `1063` event with `FileMetadataFactory`, then
            sign and publish it to your outbox relays.
          </p>
          <div className="inline-flex rounded-full border border-base-300 px-4 py-2 text-sm">Choose file</div>
        </div>
      </button>
    </>
  );
}

function MetadataField({
  label,
  value,
  onChange,
  placeholder,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <label className="block space-y-2">
      <div className="text-sm font-medium">{label}</div>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="textarea textarea-bordered min-h-24 w-full"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="input input-bordered w-full"
        />
      )}
    </label>
  );
}

function RelayResponseList({ results }: { results: { relay: string; ok: boolean; message?: string }[] }) {
  return (
    <ul className="space-y-2 text-xs font-mono">
      {results.map((result) => (
        <li key={result.relay} className="flex items-center gap-2 rounded-xl border border-base-300 px-3 py-2">
          <span className={result.ok ? "text-success" : "text-error"}>{result.ok ? "ok" : "fail"}</span>
          <span>{result.relay.replace(/^wss:\/\//, "")}</span>
          {result.message && <span className="truncate text-base-content/50">{result.message}</span>}
        </li>
      ))}
    </ul>
  );
}

function UploadStatusList({ statuses }: { statuses: UploadStatus[] }) {
  if (statuses.length === 0) return null;

  return (
    <ul className="space-y-2 text-xs font-mono">
      {statuses.map((status) => (
        <li key={status.server} className="flex items-center gap-2 rounded-xl border border-base-300 px-3 py-2">
          <span
            className={
              status.state === "uploaded"
                ? "text-success"
                : status.state === "error"
                  ? "text-error"
                  : "text-base-content/60"
            }
          >
            {status.state}
          </span>
          <span>{status.server.replace(/^https:\/\//, "")}</span>
          {status.url && <span className="truncate text-base-content/50">{status.url}</span>}
          {status.message && <span className="truncate text-base-content/50">{status.message}</span>}
        </li>
      ))}
    </ul>
  );
}

function Publisher({ user, signer }: { user: User; signer: ISigner }) {
  const blossomServers = use$(() => user.blossomServers$, [user.pubkey]);
  const mailboxes = use$(() => user.mailboxes$, [user.pubkey]);
  const profile = use$(() => user.profile$, [user.pubkey]);
  const publishRelays = useMemo(
    () => (mailboxes?.outboxes?.length ? relaySet(FALLBACK_RELAYS, mailboxes.outboxes) : FALLBACK_RELAYS),
    [mailboxes],
  );
  const userDisplayName = getDisplayName(profile, user.pubkey.slice(0, 8) + "...");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [draftPreview, setDraftPreview] = useState<Awaited<ReturnType<typeof FileMetadataFactory.fromUpload>> | null>(
    null,
  );
  const [publishedEvent, setPublishedEvent] = useState<NostrEvent | null>(null);
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [useMediaOptimization, setUseMediaOptimization] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ relay: string; ok: boolean; message?: string }[] | null>(null);
  const [uploadStatuses, setUploadStatuses] = useState<UploadStatus[]>([]);
  const [fields, setFields] = useState<MetadataFormState>({
    summary: "",
    alt: "",
    thumbnail: "",
    image: "",
    dimensions: "",
    blurhash: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function buildDraft() {
      if (!uploadResult) {
        setDraftPreview(null);
        return;
      }

      const draft = await FileMetadataFactory.create(uploadResult.metadata)
        .summary(fields.summary || null)
        .alt(fields.alt || null)
        .thumbnail(fields.thumbnail || null)
        .image(fields.image || null)
        .dimensions(fields.dimensions || null)
        .blurhash(fields.blurhash || null);

      if (!cancelled) setDraftPreview(draft);
    }

    void buildDraft();
    return () => {
      cancelled = true;
    };
  }, [uploadResult, fields]);

  const publishedCast = useMemo(
    () => (publishedEvent ? castEvent(publishedEvent, FileMetadata, eventStore) : null),
    [publishedEvent],
  );
  const authorProfile = use$(() => publishedCast?.author.profile$, [publishedCast?.author.pubkey]);

  const resetFlow = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setDraftPreview(null);
    setPublishedEvent(null);
    setResults(null);
    setUploadStatuses([]);
    setError(null);
    setFields({ summary: "", alt: "", thumbnail: "", image: "", dimensions: "", blurhash: "" });
  };

  const handleFile = async (file: File) => {
    setSelectedFile(file);
    setUploadResult(null);
    setDraftPreview(null);
    setPublishedEvent(null);
    setResults(null);
    setUploadStatuses(
      (blossomServers?.length ? blossomServers : DEFAULT_BLOSSOM_SERVERS).map((server) => ({
        server: server.href,
        state: "pending",
      })),
    );
    setError(null);
    setFields({ summary: file.name, alt: "", thumbnail: "", image: "", dimensions: "", blurhash: "" });

    setUploading(true);
    try {
      const uploaded = await uploadFileToBlossom(file, signer, blossomServers, useMediaOptimization, {
        onStart: (server) =>
          setUploadStatuses((current) =>
            current.map((status) =>
              status.server === server.href ? { ...status, state: "uploading", message: undefined } : status,
            ),
          ),
        onUpload: (server) =>
          setUploadStatuses((current) =>
            current.map((status) =>
              status.server === server.href ? { ...status, state: "uploaded", message: undefined } : status,
            ),
          ),
        onError: (server, uploadError) =>
          setUploadStatuses((current) =>
            current.map((status) =>
              status.server === server.href
                ? {
                    ...status,
                    state: "error",
                    message: uploadError instanceof Error ? uploadError.message : "Upload failed",
                  }
                : status,
            ),
          ),
      });
      setUploadResult(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handlePublish = async () => {
    if (!draftPreview) return;

    setPublishing(true);
    setError(null);
    setResults(null);
    try {
      const signed = await FileMetadataFactory.create({
        ...uploadResult?.metadata,
      })
        .summary(fields.summary || null)
        .alt(fields.alt || null)
        .thumbnail(fields.thumbnail || null)
        .image(fields.image || null)
        .dimensions(fields.dimensions || null)
        .blurhash(fields.blurhash || null)
        .sign(signer);

      const responses = await pool.publish(publishRelays, signed);
      eventStore.add(signed);
      setPublishedEvent(signed);
      setResults(responses.map((response) => ({ relay: response.from, ok: response.ok, message: response.message })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  const displayName = publishedCast
    ? getDisplayName(authorProfile, publishedCast.author.pubkey.slice(0, 8) + "...")
    : undefined;
  const avatar = publishedCast
    ? getProfilePicture(authorProfile, `https://robohash.org/${publishedCast.author.pubkey}.png`)
    : undefined;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4 p-4">
      <section className="rounded-3xl border border-base-300 bg-base-100 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">File Publisher</h1>
            <p className="mt-2 max-w-3xl text-sm text-base-content/70">
              Upload a file to your blossom servers, review the resulting kind `1063` metadata event, then sign and
              publish it to your NIP-65 outbox relays.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-base-content/60">Signed in as</div>
            <div className="mt-1 text-sm font-semibold">{userDisplayName}</div>
            <div className="mt-1 font-mono text-xs text-base-content/60">
              {nip19.npubEncode(user.pubkey).slice(0, 18)}...
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-base-300 pt-4 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-base-content/60">Blossom servers</span>
            <ServerAvatarStack servers={blossomServers?.length ? blossomServers : DEFAULT_BLOSSOM_SERVERS} />
            {!blossomServers?.length && <span className="text-xs text-base-content/50">using default server</span>}
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-base-content/80">
            <input
              type="checkbox"
              className="toggle toggle-sm"
              checked={useMediaOptimization}
              onChange={() => setUseMediaOptimization((value) => !value)}
            />
            <span>Media optimization</span>
          </label>
        </div>
      </section>

      {!selectedFile && <FileDropZone disabled={uploading} onSelect={(file) => void handleFile(file)} />}

      {uploading && (
        <section className="rounded-2xl border border-base-300 bg-base-100 p-8 text-center">
          <span className="loading loading-spinner loading-lg" />
          <div className="mt-4 text-sm text-base-content/70">Uploading to blossom servers...</div>
          <div className="mx-auto mt-6 max-w-3xl text-left">
            <UploadStatusList statuses={uploadStatuses} />
          </div>
        </section>
      )}

      {error && (
        <section className="rounded-2xl border border-error/40 bg-base-100 p-4 text-sm text-error">{error}</section>
      )}

      {selectedFile && !uploading && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <section className="min-w-0 space-y-4 rounded-3xl border border-base-300 bg-base-100 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-base-content/60">Selected file</div>
                <div className="mt-1 text-xl font-semibold">{selectedFile.name}</div>
                <div className="mt-1 text-sm text-base-content/70">
                  {selectedFile.type || "Unknown MIME type"} · {formatBytes(selectedFile.size)}
                </div>
              </div>
              <button className="btn btn-sm" onClick={resetFlow}>
                Choose another
              </button>
            </div>

            <FilePreview file={selectedFile} remoteUrl={uploadResult?.metadata.url} />

            {uploadResult && (
              <div className="rounded-2xl border border-base-300 p-4 text-sm">
                <div className="font-semibold">Upload result</div>
                <div className="mt-3 space-y-2 text-base-content/80">
                  <div>Primary URL: {uploadResult.metadata.url}</div>
                  <div>SHA-256: {uploadResult.metadata.sha256}</div>
                  <div>MIME type: {uploadResult.metadata.type || "Unknown"}</div>
                  <div>Stored on {uploadResult.publishedURLs.length} blossom server(s)</div>
                </div>
                <div className="mt-4">
                  <UploadStatusList statuses={uploadStatuses} />
                </div>
              </div>
            )}

            {publishedCast && displayName && avatar && (
              <div className="rounded-2xl border border-base-300 p-4">
                <div className="text-sm font-semibold">Published event</div>
                <div className="mt-4 flex items-start gap-3">
                  <img src={avatar} alt={displayName} className="h-12 w-12 rounded-full border border-base-300" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{displayName}</div>
                    <div className="text-xs text-base-content/60">{publishedCast.createdAt.toLocaleString()}</div>
                    <a
                      href={publishedCast.url}
                      target="_blank"
                      rel="noreferrer"
                      className="link mt-2 block truncate text-sm"
                    >
                      {publishedCast.url}
                    </a>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-base-content/70">
                  {publishedCast.type && (
                    <div className="rounded-full border border-base-300 px-2 py-1">{publishedCast.type}</div>
                  )}
                  {publishedCast.size !== undefined && (
                    <div className="rounded-full border border-base-300 px-2 py-1">
                      {formatBytes(publishedCast.size)}
                    </div>
                  )}
                  {publishedCast.dimensions && (
                    <div className="rounded-full border border-base-300 px-2 py-1">{publishedCast.dimensions}</div>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="min-w-0 space-y-4 rounded-3xl border border-base-300 bg-base-100 p-5">
            <div>
              <div className="text-lg font-semibold">Metadata</div>
              <div className="mt-1 text-sm text-base-content/60">
                Edit the optional fields that will be added to the file metadata event.
              </div>
            </div>

            <MetadataField
              label="Summary"
              value={fields.summary}
              onChange={(summary) => setFields((current) => ({ ...current, summary }))}
              placeholder="Short title or summary"
            />
            <MetadataField
              label="Alt text"
              value={fields.alt}
              onChange={(alt) => setFields((current) => ({ ...current, alt }))}
              placeholder="Accessibility description"
              textarea
            />
            <MetadataField
              label="Thumbnail URL"
              value={fields.thumbnail}
              onChange={(thumbnail) => setFields((current) => ({ ...current, thumbnail }))}
              placeholder="https://..."
            />
            <MetadataField
              label="Preview image URL"
              value={fields.image}
              onChange={(image) => setFields((current) => ({ ...current, image }))}
              placeholder="https://..."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <MetadataField
                label="Dimensions"
                value={fields.dimensions}
                onChange={(dimensions) => setFields((current) => ({ ...current, dimensions }))}
                placeholder="1200x800"
              />
              <MetadataField
                label="Blurhash"
                value={fields.blurhash}
                onChange={(blurhash) => setFields((current) => ({ ...current, blurhash }))}
                placeholder="LEHV6nWB2yk8..."
              />
            </div>

            <div className="rounded-2xl border border-base-300 p-4">
              <div className="text-sm font-semibold">Publish relays</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {publishRelays.map((relay) => (
                  <div key={relay} className="rounded-full border border-base-300 px-2 py-1 text-xs font-mono">
                    {relay.replace(/^wss:\/\//, "")}
                  </div>
                ))}
              </div>
            </div>

            {draftPreview && (
              <div className="rounded-2xl border border-base-300 p-4">
                <div className="text-sm font-semibold">Draft tags</div>
                <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto text-xs font-mono text-base-content/80">
                  {draftPreview.tags.map((tag, index) => (
                    <li key={`${tag[0]}-${index}`}>[{tag.map((part) => JSON.stringify(part)).join(", ")}]</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <button className="btn" onClick={resetFlow}>
                Reset
              </button>
              <button
                className="btn btn-primary"
                disabled={!uploadResult || publishing}
                onClick={() => void handlePublish()}
              >
                {publishing ? <span className="loading loading-spinner loading-sm" /> : "Sign & publish"}
              </button>
            </div>
          </section>
        </div>
      )}

      {results && (
        <section className="rounded-3xl border border-base-300 bg-base-100 p-5">
          <div className="mb-4 text-lg font-semibold">Relay responses</div>
          <RelayResponseList results={results} />
        </section>
      )}
    </div>
  );
}

export default function FilePublisherExample() {
  const signer = use$(signer$);
  const user = use$(user$);

  if (!signer || !user) {
    return (
      <LoginView
        onLogin={(nextSigner, pubkey) => {
          signer$.next(nextSigner);
          pubkey$.next(pubkey);
        }}
      />
    );
  }

  return <Publisher user={user} signer={signer} />;
}
