/**
 * Compose a kind 1 note with nostr-editor, build it with NoteFactory, then confirm and publish to outbox relays.
 * Supports uploading images, videos, and files to the user's configured blossom servers.
 * @tags nip-01, nip-65, compose, editor, nostr-editor, blossom, file-upload
 * @related notes/rendering, simple/profile-editor, blossom/server-manager
 */
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { castUser, User } from "applesauce-common/casts";
import { NoteFactory, type NoteTemplate } from "applesauce-common/factories";
import { EventStore } from "applesauce-core";
import { EventFactory } from "applesauce-core/factories";
import { relaySet } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import type { ISigner } from "applesauce-signers";
import { multiServerMediaUpload, multiServerUpload } from "blossom-client-sdk/actions/multi-server";
import { createUploadAuth } from "blossom-client-sdk/auth";
import type { FileAttributes, NostrStorage, UploadTask } from "nostr-editor";
import { NostrExtension } from "nostr-editor";
import { nip19 } from "nostr-tools";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

/** Unsigned kind 1 draft ready to sign and publish */
const draftNote$ = new BehaviorSubject<NoteTemplate | null>(null);

const DEFAULT_BLOSSOM_SERVERS = [new URL("https://blossom.primal.net")];

/** Create a blossom upload handler for nostr-editor's fileUpload extension */
function createBlossomUploader(signer: ISigner, blossomServers: URL[] | undefined, useMediaOptimization: boolean) {
  return async (attrs: FileAttributes): Promise<UploadTask> => {
    const file = attrs.file;
    if (!file) return { error: "No file provided" };

    const servers = blossomServers?.length ? blossomServers : DEFAULT_BLOSSOM_SERVERS;
    const isImageOrVideo = file.type.startsWith("image/") || file.type.startsWith("video/");
    const isMedia = useMediaOptimization && isImageOrVideo;

    try {
      const results = await (isMedia ? multiServerMediaUpload : multiServerUpload)(servers, file, {
        onAuth: (_server, sha256, type) => createUploadAuth((draft) => signer.signEvent(draft), sha256, { type }),
      });

      // Use the first successful result (primary server)
      const [, blob] = results.entries().next().value!;

      return {
        result: {
          url: blob.url,
          sha256: blob.sha256,
          tags: [
            ["url", blob.url],
            ["x", blob.sha256],
            ...(blob.size ? [["size", String(blob.size)]] : []),
            ...(blob.type ? [["m", blob.type]] : []),
          ],
        },
      };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Upload failed" };
    }
  };
}

/** Favicon avatar for a blossom server */
function ServerFavicon({ server }: { server: URL }) {
  const [error, setError] = useState(false);
  const faviconUrl = new URL("/favicon.ico", server).href;

  if (error) {
    return (
      <div
        className="w-6 h-6 rounded-full bg-base-200 flex items-center justify-center text-[10px] font-bold"
        title={server.hostname}
      >
        {server.hostname[0].toUpperCase()}
      </div>
    );
  }

  return (
    <img
      src={faviconUrl}
      alt={server.hostname}
      title={server.hostname}
      className="w-6 h-6 rounded-full bg-base-200"
      onError={() => setError(true)}
    />
  );
}

/** Avatar stack showing blossom servers */
function ServerAvatarStack({ servers }: { servers: URL[] }) {
  return (
    <div className="flex -space-x-2">
      {servers.map((server) => (
        <div key={server.href} className="ring-2 ring-base-100 rounded-full">
          <ServerFavicon server={server} />
        </div>
      ))}
    </div>
  );
}

function nostrStorage(editor: Editor): NostrStorage {
  return (editor.storage as unknown as { nostr: NostrStorage }).nostr;
}

async function noteTemplateFromEditor(editor: Editor): Promise<NoteTemplate> {
  const content = editor.getText({ blockSeparator: "\n\n" }).trim();
  if (!content) throw new Error("Write something before continuing.");

  let factory = NoteFactory.create().text(content);
  const imeta = nostrStorage(editor).getImetaTags();
  if (imeta.length > 0) {
    factory = factory.modifyPublicTags((tags) => [...tags, ...imeta]);
  }
  return factory;
}

function ComposerBody({ user, signer, onContinue }: { user: User; signer: ISigner; onContinue: () => void }) {
  const [buildError, setBuildError] = useState<string | null>(null);
  const [mediaOptimization, setMediaOptimization] = useState(true);
  const blossomServers = use$(() => user.blossomServers$, [user.pubkey]);

  // Keep refs so the editor upload closure always sees the latest values
  const blossomServersRef = useRef(blossomServers);
  blossomServersRef.current = blossomServers;
  const mediaOptimizationRef = useRef(mediaOptimization);
  mediaOptimizationRef.current = mediaOptimization;

  const editor = useEditor(
    {
      extensions: [
        StarterKit,
        NostrExtension.configure({
          fileUpload: {
            immediateUpload: true,
            allowedMimeTypes: [
              "image/jpeg",
              "image/png",
              "image/gif",
              "image/webp",
              "image/svg+xml",
              "video/mp4",
              "video/webm",
              "video/quicktime",
              "audio/mpeg",
              "audio/ogg",
              "audio/wav",
              "audio/webm",
            ],
            upload: (attrs) =>
              createBlossomUploader(signer, blossomServersRef.current, mediaOptimizationRef.current)(attrs),
          },
          link: { autolink: true },
        }),
      ],
      content: "",
      autofocus: true,
      editorProps: {
        attributes: {
          class: "min-h-[220px] px-3 py-2 outline-none focus:outline-none max-w-none text-base leading-relaxed",
        },
      },
    },
    [],
  );

  const handleContinue = useCallback(async () => {
    if (!editor) return;
    setBuildError(null);
    try {
      const template = await noteTemplateFromEditor(editor);
      draftNote$.next(template);
      onContinue();
    } catch (e) {
      setBuildError(e instanceof Error ? e.message : "Could not build note");
    }
  }, [editor, onContinue]);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Compose note</h1>
        <span className="text-sm text-base-content/60 font-mono">{nip19.npubEncode(user.pubkey).slice(0, 16)}…</span>
      </div>
      <p className="text-base-content/70 text-sm">
        Use the editor to write a kind 1 note. Mentions, links, and hashtags are turned into the right Nostr content and
        tags when you build the event. Drag and drop or attach images and videos — they are uploaded to your blossom
        server automatically.
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
      {buildError && <div className="text-error text-sm">{buildError}</div>}
      <div className="border border-base-300 rounded-lg bg-base-100 overflow-hidden">
        {editor ? (
          <EditorContent editor={editor} />
        ) : (
          <div className="min-h-[220px] p-4 text-base-content/50">Loading…</div>
        )}
        {editor && (
          <div className="flex items-center gap-2 px-3 py-2 border-t border-base-300">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => editor.commands.selectFiles()}
              title="Attach file"
            >
              Attach file
            </button>
            <div className="ml-auto flex items-center gap-2">
              <ServerAvatarStack servers={blossomServers?.length ? blossomServers : DEFAULT_BLOSSOM_SERVERS} />
              {!blossomServers?.length && <span className="text-xs text-base-content/50">(default)</span>}
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <button type="button" className="btn btn-primary" onClick={handleContinue} disabled={!editor}>
          Review & publish
        </button>
      </div>
    </div>
  );
}

function PublishBody({
  user,
  signer,
  draft,
  onBack,
}: {
  user: User;
  signer: ISigner;
  draft: NoteTemplate;
  onBack: () => void;
}) {
  const mailboxes = use$(() => user.mailboxes$, [user.pubkey]);
  const publishRelays = useMemo(
    () => (mailboxes?.outboxes?.length ? relaySet(FALLBACK_RELAYS, mailboxes.outboxes) : FALLBACK_RELAYS),
    [mailboxes],
  );

  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [lastResults, setLastResults] = useState<{ relay: string; ok: boolean; message?: string }[] | null>(null);

  const handleBack = useCallback(() => {
    setLastResults(null);
    setPublishError(null);
    draftNote$.next(null);
    onBack();
  }, [onBack]);

  const handlePublish = useCallback(async () => {
    setPublishing(true);
    setPublishError(null);
    setLastResults(null);
    try {
      const toSign = { ...draft, created_at: Math.floor(Date.now() / 1000) };
      const signed = await new EventFactory((res) => res(toSign)).sign(signer);
      const responses = await pool.publish(publishRelays, signed);
      eventStore.add(signed);
      setLastResults(responses.map((r) => ({ relay: r.from, ok: r.ok, message: r.message })));
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }, [draft, publishRelays, signer]);

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Publish</h1>
        <button type="button" className="btn btn-ghost btn-sm" onClick={handleBack}>
          Back to editor
        </button>
      </div>
      <p className="text-base-content/70 text-sm">
        This is the unsigned kind 1 draft from <code className="text-xs bg-base-200 px-1 rounded">NoteFactory</code>.
        Signing uses your extension; events are sent to your NIP-65 outbox relays when available.
      </p>
      <section className="border border-base-300 rounded-lg p-4 space-y-2">
        <h2 className="font-semibold text-sm text-base-content/60">Content</h2>
        <pre className="whitespace-pre-wrap text-sm font-sans">{draft.content}</pre>
      </section>
      <section className="border border-base-300 rounded-lg p-4 space-y-2">
        <h2 className="font-semibold text-sm text-base-content/60">Tags ({draft.tags.length})</h2>
        <ul className="text-xs font-mono space-y-1 max-h-40 overflow-y-auto">
          {draft.tags.map((t, i) => (
            <li key={i} className="text-base-content/80">
              [{t.map((c) => JSON.stringify(c)).join(", ")}]
            </li>
          ))}
        </ul>
      </section>
      <section className="border border-base-300 rounded-lg p-4 space-y-2">
        <h2 className="font-semibold text-sm text-base-content/60">Relays</h2>
        <ul className="flex flex-wrap gap-2">
          {publishRelays.map((r) => (
            <li key={r} className="badge badge-outline badge-sm font-mono">
              {r.replace(/^wss:\/\//, "")}
            </li>
          ))}
        </ul>
        {!mailboxes?.outboxes?.length && (
          <p className="text-xs text-base-content/50">No outbox list loaded yet — using default relays.</p>
        )}
      </section>
      {publishError && <div className="text-error text-sm">{publishError}</div>}
      {lastResults && (
        <div className="border border-base-300 rounded-lg p-4 space-y-2">
          <h2 className="font-semibold text-sm text-base-content/60">Relay responses</h2>
          <ul className="space-y-1 text-xs font-mono">
            {lastResults.map((r) => (
              <li key={r.relay} className="flex gap-2 items-center">
                <span className={r.ok ? "text-success" : "text-error"}>{r.ok ? "ok" : "fail"}</span>
                <span>{r.relay.replace(/^wss:\/\//, "")}</span>
                {r.message && <span className="text-base-content/50 truncate">{r.message}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={handleBack} disabled={publishing}>
          Edit again
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handlePublish}
          disabled={publishing || !!lastResults}
        >
          {publishing ? <span className="loading loading-spinner loading-sm" /> : "Sign & publish"}
        </button>
      </div>
    </div>
  );
}

function SignedInFlow({ user, signer }: { user: User; signer: ISigner }) {
  const draft = use$(draftNote$);
  const [screen, setScreen] = useState<"compose" | "publish">("compose");

  const goPublish = useCallback(() => setScreen("publish"), []);
  const goCompose = useCallback(() => setScreen("compose"), []);

  useEffect(() => {
    if (screen === "publish" && !draft) setScreen("compose");
  }, [draft, screen]);

  return (
    <>
      <div className={screen === "compose" ? "" : "hidden"}>
        <ComposerBody user={user} signer={signer} onContinue={goPublish} />
      </div>
      {screen === "publish" && draft && <PublishBody user={user} signer={signer} draft={draft} onBack={goCompose} />}
    </>
  );
}

export default function NoteComposingExample() {
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
    <div className="container mx-auto p-4 min-h-xl">
      <SignedInFlow user={user} signer={signer} />
    </div>
  );
}
