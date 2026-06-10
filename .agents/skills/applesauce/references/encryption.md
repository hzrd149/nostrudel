# Encrypted content (NIP-04 / NIP-44) and hidden tags

Read this when handling DMs (NIP-04 legacy, NIP-44 versioned, NIP-17 gift-wrapped) or any event with hidden tags (NIP-51 mute lists, bookmarks, etc.).

Encrypted content and hidden tags are **opt-in**: the store holds the raw event; you decide when to decrypt. Applesauce caches the decrypted result on the event's symbol once decrypted so models and casts can deliver it reactively without re-decrypting per render.

## One-time wiring at startup

Call `persistEncryptedContent(signer, eventStore)` once, after the active signer is known. This lets the `EncryptedContentModel` (and casts that read it) deliver decrypted bodies as the signer permits, instead of every component fending for itself.

```ts
import { persistEncryptedContent } from "applesauce-core/helpers";

persistEncryptedContent(signer, eventStore);
```

Switching signers (different active account)? Call it again with the new signer. The store entries are cached on the event symbol per signer.

## Reading encrypted content reactively

```ts
import { EncryptedContentModel } from "applesauce-core/models";

eventStore.model(EncryptedContentModel, event).subscribe((content) => {
  // content: string | undefined — undefined until decrypted, then the plaintext
});
```

In React: `useEventModel(EncryptedContentModel, [event])`.

If the user hasn't authorized decryption yet (NIP-07 prompt, NIP-46 round-trip, …), `content` stays `undefined`. The signer's UX is the source of truth — don't gate UI on a sync check; let the observable flip when permission lands.

## Hidden tags lifecycle

NIP-51 lists (mute, bookmark, pin, follow sets) keep their sensitive entries inside an encrypted `content` field. Unlock once per event, then check the cached state:

```ts
import { unlockHiddenTags, isHiddenTagsUnlocked } from "applesauce-core/helpers";

if (!isHiddenTagsUnlocked(event)) {
  await unlockHiddenTags(event, signer);
}
// now models / casts see the hidden entries and re-emit
```

Gate UI on `isHiddenTagsUnlocked(event)` (or its reactive equivalent through a model) — don't try to derive it from the raw `content` string.

## NIP-17 gift-wrapped messages

`WrappedMessageBlueprint` (in `applesauce-common/factories`) and `SendWrappedMessage`/`ReplyToWrappedMessage`/`GiftWrapMessageToParticipants` (in `applesauce-actions`) handle the full NIP-59 wrap on the way out. On the way in, run incoming gift-wrap events through the unwrap helpers in `applesauce-common/helpers` (or use the `Wrap` cast) so the inner rumor reaches the store and its model fires.

## Common pitfalls

- Calling `unlockHiddenTags` or decrypting before `persistEncryptedContent(signer, eventStore)` — the result won't propagate to models.
- Calling them in a loop per render — the signer may prompt the user every time. Sign / decrypt at a stable boundary (the model, or a once-per-event effect), not per render.
- Treating empty hidden tags as "no hidden entries" instead of "not yet unlocked". Always check `isHiddenTagsUnlocked`.

## Worked examples

- `examples/messages/legacy.md` — NIP-04 DM round-trip
- `examples/messages/gift-wrap.md` — NIP-17 / NIP-59 wrapped messages

Both indexed in `examples.md`.
