import { nip19, type NostrEvent } from "nostr-tools";

export const HANDLER_PREFERENCES_KIND = 31129;
const hex = /^[a-f0-9]{64}$/;

/** No generic relay/signing grant includes management of the user's handler preferences. */
export function assertNappletEventKind(kind: number) {
  if (kind === HANDLER_PREFERENCES_KIND) throw new Error("Napplets cannot modify handler preferences");
}

export function assertNappletDecryption(pubkey: string, accountPubkey: string) {
  // Ciphertext alone cannot distinguish preference entries from other self-encrypted data.
  if (pubkey === accountPubkey) throw new Error("Napplets cannot decrypt self-encrypted account data");
}

export type HandlerEntry = {
  reference: string;
  convention?: string;
  private: boolean;
  relay?: string;
  author?: string;
};
export type HandlerPreference = { event: NostrEvent; privateTags: string[][]; locked: boolean };

export function handlerPointer(
  reference: string,
): { id: string } | { kind: number; pubkey: string; identifier: string } | undefined {
  if (hex.test(reference)) return { id: reference };
  const match = /^(15129|35129):([a-f0-9]{64}):(.*)$/.exec(reference);
  if (!match || (match[1] === "15129" ? !!match[3] : !match[3])) return undefined;
  return { kind: Number(match[1]), pubkey: match[2], identifier: match[3] };
}

export function isHandlerConvention(value: string, archetype: string) {
  const match = /^napplet:([a-z0-9][a-z0-9-]*)\/([a-z0-9][a-z0-9-]*)$/.exec(value);
  return !!match && match[1] === archetype;
}

/** Parse independently: one malformed tag must never discard its siblings. */
export function handlerEntries(preference: HandlerPreference): HandlerEntry[] {
  const archetype = preference.event.tags.find((tag) => tag[0] === "d")?.[1];
  if (!archetype) return [];
  return [false, true].flatMap((hidden) =>
    (hidden ? preference.privateTags : preference.event.tags).flatMap((tag): HandlerEntry[] => {
      const convention = tag[0] === "i" ? tag[1] : undefined;
      const reference = tag[tag[0] === "i" ? 2 : 1];
      if (!reference || !["a", "e", "i"].includes(tag[0])) return [];
      const pointer = handlerPointer(reference);
      if (!pointer || (tag[0] === "a" && "id" in pointer) || (tag[0] === "e" && !("id" in pointer))) return [];
      if (tag[0] === "i" && (!convention || !isHandlerConvention(convention, archetype))) return [];
      return [
        {
          reference,
          convention,
          private: hidden,
          relay: tag[0] !== "i" ? tag[2] : undefined,
          author: tag[0] === "e" && hex.test(tag[3] ?? "") ? tag[3] : undefined,
        },
      ];
    }),
  );
}

/** Visibility is not priority. Only fall back to archetype scope if no specific option is usable. */
export function preferredHandlerReferences(
  preference: HandlerPreference,
  convention: string,
  usable: (reference: string) => boolean,
) {
  const entries = handlerEntries(preference);
  const specific = entries.filter((entry) => entry.convention === convention && usable(entry.reference));
  return [
    ...new Set(
      (specific.length ? specific : entries.filter((entry) => !entry.convention && usable(entry.reference))).map(
        (entry) => entry.reference,
      ),
    ),
  ];
}

export function handlerReference(address: string): string | undefined {
  if (handlerPointer(address)) return address;
  try {
    const pointer = nip19.decode(address);
    if (pointer.type === "naddr") return `${pointer.data.kind}:${pointer.data.pubkey}:${pointer.data.identifier}`;
    if (pointer.type === "nevent") return pointer.data.id;
    if (pointer.type === "note") return pointer.data;
    return undefined;
  } catch {
    return undefined;
  }
}

export function handlerAddress(reference: string) {
  const pointer = handlerPointer(reference);
  return pointer && ("id" in pointer ? nip19.neventEncode({ id: pointer.id }) : nip19.naddrEncode(pointer));
}

/** Preserve extension tags, hints, and other scopes when editing one option. */
export function editHandlerEntry(preference: HandlerPreference, entry: HandlerEntry, remove = false) {
  const groups = [preference.event.tags, preference.privateTags].map((tags, index) =>
    tags.filter(
      (tag) =>
        !(
          (!remove || index === (entry.private ? 1 : 0)) &&
          (entry.convention
            ? tag[0] === "i" && tag[1] === entry.convention && tag[2] === entry.reference
            : (tag[0] === "a" || tag[0] === "e") && tag[1] === entry.reference)
        ),
    ),
  );
  if (!remove) {
    const existing = [...preference.event.tags, ...preference.privateTags].find((tag) =>
      entry.convention
        ? tag[0] === "i" && tag[1] === entry.convention && tag[2] === entry.reference
        : (tag[0] === "a" || tag[0] === "e") && tag[1] === entry.reference,
    );
    const tag = entry.convention
      ? ["i", entry.convention, entry.reference]
      : [entry.reference.includes(":") ? "a" : "e", entry.reference];
    if (!entry.convention && (entry.relay || entry.author)) {
      tag.push(entry.relay ?? "");
      if (tag[0] === "e" && entry.author) tag.push(entry.author);
    }
    groups[entry.private ? 1 : 0].push(existing ?? tag);
  }
  return groups;
}
