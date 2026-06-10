/**
 * Login, select one of your git repositories, edit it, and republish updates
 * @tags nip-34, git, repository, editing, publishing
 * @related git/grasp-server-manager, git/favorite-repos-feed
 */
import { castUser, GitRepository, type User } from "applesauce-common/casts";
import { GitRepositoryFactory } from "applesauce-common/factories";
import { GIT_REPOSITORY_KIND, type GitRepositoryPointer } from "applesauce-common/helpers";
import { defined, EventStore } from "applesauce-core";
import { getDisplayName, getProfilePicture } from "applesauce-core/helpers";
import { createEventLoaderForStore } from "applesauce-loaders/loaders";
import { use$ } from "applesauce-react/hooks";
import { RelayPool } from "applesauce-relay";
import type { ISigner } from "applesauce-signers";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { BehaviorSubject, EMPTY, map, of } from "rxjs";
import LoginView from "../../components/login-view";
import PubkeyPicker from "../../components/pubkey-picker";

const signer$ = new BehaviorSubject<ISigner | null>(null);
const pubkey$ = new BehaviorSubject<string | null>(null);

const eventStore = new EventStore();
const pool = new RelayPool();

const user$ = pubkey$.pipe(map((pubkey) => (pubkey ? castUser(pubkey, eventStore) : undefined)));

createEventLoaderForStore(eventStore, pool, {
  lookupRelays: ["wss://purplepag.es/", "wss://index.hzrd149.com/"],
  extraRelays: ["wss://relay.damus.io/", "wss://nos.lol/", "wss://relay.primal.net/", "wss://relay.nostr.band/"],
});

function toDelimitedText(values: string[]) {
  return values.join("\n");
}

function parseDelimitedText(value: string) {
  return value
    .split(/[\n,]/g)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

type RepoEditorFormValues = {
  name: string;
  description: string;
  webUrls: string;
  cloneUrls: string;
  relays: string;
  maintainers: { pubkey: string }[];
  hashtags: string;
  earliestUniqueCommit: string;
  upstreamPubkey: string;
  upstreamIdentifier: string;
  upstreamRelay: string;
};

function MaintainerListItem({ pubkey, onRemove }: { pubkey: string; onRemove: () => void }) {
  const maintainer = useMemo(() => castUser(pubkey, eventStore), [pubkey]);
  const profile = use$(maintainer.profile$);
  const displayName = getDisplayName(profile, pubkey.slice(0, 8) + "...");
  const picture = getProfilePicture(profile, `https://robohash.org/${pubkey}.png`);

  return (
    <div className="flex items-center justify-between gap-3 border border-base-300 p-2">
      <div className="flex items-center gap-3 min-w-0">
        <div className="avatar">
          <div className="w-9 h-9 rounded-full border border-base-300">
            <img src={picture} alt={displayName} />
          </div>
        </div>
        <div className="min-w-0">
          <div className="font-medium truncate">{displayName}</div>
          <div className="text-xs text-base-content/60 font-mono truncate">{pubkey}</div>
        </div>
      </div>

      <button type="button" className="btn btn-sm btn-error" onClick={onRemove}>
        Remove
      </button>
    </div>
  );
}

function RepositoryEditor({
  repository,
  user,
  graspRelayHints,
  onSave,
  isSaving,
}: {
  repository: GitRepository;
  user: User;
  graspRelayHints: string[];
  onSave: (input: RepoFormInput) => void;
  isSaving: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    formState: { isValid },
  } = useForm<RepoEditorFormValues>({
    mode: "onChange",
    defaultValues: {
      name: "",
      description: "",
      webUrls: "",
      cloneUrls: "",
      relays: "",
      maintainers: [],
      hashtags: "",
      earliestUniqueCommit: "",
      upstreamPubkey: "",
      upstreamIdentifier: "",
      upstreamRelay: "",
    },
  });
  const [newMaintainer, setNewMaintainer] = useState("");
  const {
    fields: maintainerFields,
    append: appendMaintainer,
    remove: removeMaintainerAt,
  } = useFieldArray({
    control,
    name: "maintainers",
  });
  const maintainers = watch("maintainers") ?? [];
  const upstreamPubkeyValue = watch("upstreamPubkey");
  const [upstreamEnabled, setUpstreamEnabled] = useState(
    () => !!(repository.upstream?.pubkey && repository.upstream?.identifier),
  );

  const upstreamAuthor = useMemo(() => {
    const pk = upstreamPubkeyValue?.trim();
    if (!upstreamEnabled || !pk || !/^[0-9a-f]{64}$/i.test(pk)) return null;
    return castUser(pk.toLowerCase(), eventStore);
  }, [upstreamEnabled, upstreamPubkeyValue]);

  use$(() => {
    if (!upstreamEnabled) return EMPTY;
    const pk = upstreamPubkeyValue?.trim();
    if (!pk || !/^[0-9a-f]{64}$/i.test(pk)) return EMPTY;
    return pool.subscription(
      user.outboxes$.pipe(defined()),
      { kinds: [GIT_REPOSITORY_KIND], authors: [pk.toLowerCase()] },
      { eventStore },
    );
  }, [user.pubkey, upstreamEnabled, upstreamPubkeyValue]);

  const upstreamRepos = use$(
    () => (upstreamAuthor ? upstreamAuthor.timeline$(GIT_REPOSITORY_KIND, GitRepository) : of([] as GitRepository[])),
    [upstreamAuthor],
  );

  const upstreamIdentifierOptions = useMemo(() => {
    const repos = upstreamRepos ?? [];
    return [...new Set(repos.map((r) => r.identifier).filter(Boolean))].sort();
  }, [upstreamRepos]);

  useEffect(() => {
    reset({
      name: repository.name ?? "",
      description: repository.description ?? "",
      webUrls: toDelimitedText(repository.webUrls),
      cloneUrls: toDelimitedText(repository.cloneUrls),
      relays: toDelimitedText(repository.relays),
      maintainers: repository.maintainerPubkeys.map((pubkey) => ({ pubkey })),
      hashtags: toDelimitedText(repository.hashtags),
      earliestUniqueCommit: repository.earliestUniqueCommit ?? "",
      upstreamPubkey: repository.upstream?.pubkey ?? "",
      upstreamIdentifier: repository.upstream?.identifier ?? "",
      upstreamRelay: repository.upstream?.relays?.[0] ?? "",
    });
    setNewMaintainer("");
    setUpstreamEnabled(!!(repository.upstream?.pubkey && repository.upstream?.identifier));
  }, [repository.uid, reset]);

  const addMaintainer = useCallback(() => {
    const pubkey = newMaintainer.trim();
    if (!pubkey || maintainers.some((item) => item.pubkey === pubkey)) return;
    appendMaintainer({ pubkey });
    setNewMaintainer("");
  }, [newMaintainer, maintainers, appendMaintainer]);

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit((values) =>
        onSave({
          name: values.name.trim(),
          description: values.description.trim(),
          webUrls: parseDelimitedText(values.webUrls),
          cloneUrls: parseDelimitedText(values.cloneUrls),
          relays: parseDelimitedText(values.relays),
          maintainers: values.maintainers.map((maintainer) => maintainer.pubkey),
          hashtags: parseDelimitedText(values.hashtags),
          earliestUniqueCommit: values.earliestUniqueCommit.trim(),
          upstreamPubkey: upstreamEnabled ? values.upstreamPubkey.trim() : "",
          upstreamIdentifier: upstreamEnabled ? values.upstreamIdentifier.trim() : "",
          upstreamRelay: upstreamEnabled ? values.upstreamRelay.trim() : "",
        }),
      )}
    >
      <div>
        <label className="label">Identifier (d tag)</label>
        <input className="input input-bordered w-full font-mono" value={repository.identifier} disabled />
      </div>

      <div>
        <label className="label">Name</label>
        <input className="input input-bordered w-full" {...register("name")} placeholder="Repository display name" />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="textarea textarea-bordered w-full min-h-24"
          {...register("description")}
          placeholder="A short repository description"
        />
      </div>

      <div>
        <label className="label">Web URLs (one per line)</label>
        <textarea
          className="textarea textarea-bordered w-full min-h-20 font-mono text-sm"
          {...register("webUrls")}
          placeholder="https://github.com/owner/repo"
        />
      </div>

      <div>
        <label className="label">Clone URLs (one per line)</label>
        <textarea
          className="textarea textarea-bordered w-full min-h-20 font-mono text-sm"
          {...register("cloneUrls")}
          placeholder="https://github.com/owner/repo.git"
        />
      </div>

      <div>
        <label className="label">Relays (one per line)</label>
        <textarea
          className="textarea textarea-bordered w-full min-h-20 font-mono text-sm"
          {...register("relays")}
          placeholder="wss://relay.example.com"
        />
      </div>

      <div>
        <label className="label">Maintainers</label>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 items-start">
            <PubkeyPicker
              value={newMaintainer}
              onChange={setNewMaintainer}
              placeholder="Enter or search for a maintainer pubkey"
              className="flex-1"
            />
            <button
              type="button"
              className="btn btn-outline"
              onClick={addMaintainer}
              disabled={!newMaintainer.trim() || maintainers.some((item) => item.pubkey === newMaintainer.trim())}
            >
              Add
            </button>
          </div>

          {maintainers.length === 0 ? (
            <div className="text-sm text-base-content/60 border border-base-300 p-3">No maintainers set.</div>
          ) : (
            <div className="flex flex-col gap-2">
              {maintainerFields.map((field, index) => (
                <MaintainerListItem
                  key={field.id}
                  pubkey={maintainers[index]?.pubkey ?? ""}
                  onRemove={() => removeMaintainerAt(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="label">Hashtags (one per line)</label>
        <textarea
          className="textarea textarea-bordered w-full min-h-20"
          {...register("hashtags")}
          placeholder="nostr"
        />
      </div>

      <div>
        <label className="label">Earliest unique commit (optional)</label>
        <input
          className="input input-bordered w-full font-mono text-sm"
          {...register("earliestUniqueCommit")}
          placeholder="commit hash"
        />
      </div>

      <div className="space-y-3">
        <label className="label cursor-pointer justify-start gap-2 py-0">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={upstreamEnabled}
            onChange={(e) => {
              const on = e.target.checked;
              setUpstreamEnabled(on);
              if (!on) {
                setValue("upstreamPubkey", "");
                setValue("upstreamIdentifier", "");
                setValue("upstreamRelay", "");
              }
            }}
          />
          <span className="label-text">Forked from another Nostr git repository</span>
        </label>
        <p className="text-xs text-base-content/60 -mt-1">
          Links this repo to the upstream pointer (NIP-34 <code className="text-xs">u</code> tag). Uncheck to clear.
        </p>

        {upstreamEnabled ? (
          <>
            <div>
              <label className="label">Upstream author</label>
              <Controller
                name="upstreamPubkey"
                control={control}
                render={({ field }) => (
                  <PubkeyPicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Pubkey or nostr identifier of upstream repo author"
                    className="w-full"
                  />
                )}
              />
            </div>
            <div>
              <label className="label">Upstream identifier (d tag)</label>
              <input
                className="input input-bordered w-full font-mono text-sm"
                list={`upstream-ident-${repository.uid}`}
                {...register("upstreamIdentifier")}
                placeholder="upstream-repo-name"
              />
              <datalist id={`upstream-ident-${repository.uid}`}>
                {upstreamIdentifierOptions.map((id) => (
                  <option key={id} value={id} />
                ))}
              </datalist>
              {upstreamAuthor && upstreamIdentifierOptions.length === 0 ? (
                <p className="text-xs text-base-content/60 mt-1">No repositories loaded for this author yet.</p>
              ) : null}
            </div>
            <div>
              <label className="label">Upstream relay hint (optional)</label>
              <input
                className="input input-bordered w-full font-mono text-sm"
                list={`upstream-relay-${repository.uid}`}
                {...register("upstreamRelay")}
                placeholder="wss://relay.example.com"
              />
              <datalist id={`upstream-relay-${repository.uid}`}>
                {graspRelayHints.map((url) => (
                  <option key={url} value={url} />
                ))}
              </datalist>
            </div>
          </>
        ) : null}
      </div>

      <button className={`btn btn-primary ${isSaving ? "loading" : ""}`} type="submit" disabled={isSaving || !isValid}>
        {isSaving ? "Saving..." : "Save"}
      </button>
    </form>
  );
}

type RepoFormInput = {
  name: string;
  description: string;
  webUrls: string[];
  cloneUrls: string[];
  relays: string[];
  maintainers: string[];
  hashtags: string[];
  earliestUniqueCommit: string;
  upstreamPubkey: string;
  upstreamIdentifier: string;
  upstreamRelay: string;
};

function RepositoryManagerView({ user }: { user: User }) {
  const signer = use$(signer$);
  const outboxes = use$(user.outboxes$);
  const graspServers = use$(user.graspServers$)?.servers;

  // Start a subscription to fetch the users repositories from their outboxes
  use$(
    () =>
      pool.subscription(
        user.outboxes$.pipe(defined()),
        { kinds: [GIT_REPOSITORY_KIND], authors: [user.pubkey] },
        { eventStore },
      ),
    [user.pubkey],
  );

  const repositories = use$(() => user.timeline$(GIT_REPOSITORY_KIND, GitRepository), [user.pubkey]);

  const orderedRepositories = useMemo(
    () => [...(repositories ?? [])].sort((a, b) => b.event.created_at - a.event.created_at),
    [repositories],
  );

  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!orderedRepositories.length) {
      setSelectedUid(null);
      return;
    }

    if (!selectedUid || !orderedRepositories.some((repo) => repo.uid === selectedUid)) {
      setSelectedUid(orderedRepositories[0].uid);
    }
  }, [orderedRepositories, selectedUid]);

  const selectedRepository = orderedRepositories.find((repo) => repo.uid === selectedUid);

  const handleSave = useCallback(
    async (input: RepoFormInput) => {
      if (!selectedRepository || !signer || !outboxes || outboxes.length === 0) return;

      try {
        setError(null);
        setIsSaving(true);

        const upstream: GitRepositoryPointer | null =
          input.upstreamPubkey && input.upstreamIdentifier
            ? {
                kind: GIT_REPOSITORY_KIND,
                pubkey: input.upstreamPubkey,
                identifier: input.upstreamIdentifier,
                ...(input.upstreamRelay ? { relays: [input.upstreamRelay] } : {}),
              }
            : null;

        const factory = GitRepositoryFactory.modify(selectedRepository.event)
          .identifier(selectedRepository.identifier)
          .name(input.name || null)
          .description(input.description || null)
          .setWebUrls(input.webUrls)
          .setCloneUrls(input.cloneUrls)
          .setRelays(input.relays)
          .setMaintainers(input.maintainers)
          .setHashtags(input.hashtags)
          .earliestUniqueCommit(input.earliestUniqueCommit || null)
          .upstream(upstream);

        const signed = await factory.sign(signer);
        eventStore.add(signed);
        const relays = Array.from(new Set([...outboxes, ...(graspServers ?? [])]));
        await pool.publish(relays, signed);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to save repository");
      } finally {
        setIsSaving(false);
      }
    },
    [selectedRepository, signer, outboxes, graspServers],
  );

  return (
    <div className="container mx-auto max-w-5xl p-4">
      {error ? (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      ) : null}

      {outboxes && outboxes.length > 0 ? (
        <div className="mb-5 border border-base-300 p-3">
          <h2 className="font-semibold mb-2">Outboxes</h2>
          <div className="flex flex-wrap gap-1">
            {outboxes.map((relay) => (
              <code key={relay} className="bg-base-200 px-2 py-1 text-xs">
                {relay}
              </code>
            ))}
          </div>
        </div>
      ) : (
        <div className="alert alert-warning mb-5">
          <span>No outbox relays found for this account yet.</span>
        </div>
      )}

      {!repositories ? (
        <div className="border border-base-300 p-4">Loading your repositories from outboxes...</div>
      ) : orderedRepositories.length === 0 ? (
        <div className="border border-base-300 p-4">
          No repositories found. Publish at least one kind {GIT_REPOSITORY_KIND} event first, then return here.
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="label">Select repository</label>
            <select
              className="select select-bordered w-full"
              value={selectedUid ?? ""}
              onChange={(event) => setSelectedUid(event.target.value)}
            >
              {orderedRepositories.map((repo) => (
                <option key={repo.uid} value={repo.uid}>
                  {(repo.name || repo.identifier).trim()} ({repo.identifier})
                </option>
              ))}
            </select>
          </div>

          {selectedRepository ? (
            <div className="border border-base-300 p-4">
              <RepositoryEditor
                repository={selectedRepository}
                user={user}
                graspRelayHints={graspServers ?? []}
                onSave={(input) => void handleSave(input)}
                isSaving={isSaving}
              />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function GitRepositoryManager() {
  const user = use$(user$);

  const handleLogin = useCallback(async (signer: ISigner, pubkey: string) => {
    signer$.next(signer);
    pubkey$.next(pubkey);
  }, []);

  if (!user) return <LoginView onLogin={handleLogin} />;

  return <RepositoryManagerView user={user} />;
}
