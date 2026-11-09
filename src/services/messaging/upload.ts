import { castUser } from "applesauce-common/casts";
import type { EventStore } from "applesauce-core";
import type { MessageFileUploader } from "applesauce-extra/messages";
import type { ISigner } from "applesauce-signers";
import { multiServerUpload } from "blossom-client-sdk/actions/multi-server";
import { createUploadAuth } from "blossom-client-sdk/auth";
import { firstValueFrom, of, timeout } from "rxjs";

export function createMessageUploader(signer: ISigner, pubkey: string, store: EventStore): MessageFileUploader {
  return async (blob, { signal }) => {
    const servers = await firstValueFrom(
      castUser(pubkey, store).blossomServers$.pipe(timeout({ first: 4000, with: () => of(undefined) })),
    );
    signal?.throwIfAborted();
    // Ciphertext must be uploaded verbatim, never through image optimization or media transforms.
    const results = await multiServerUpload(
      servers?.length ? servers : [new URL("https://blossom.band"), new URL("https://nostr.download")],
      blob,
      {
        signal,
        onAuth: (_server, hash, type) => createUploadAuth((draft) => signer.signEvent(draft), hash, { type }),
      },
    );
    const uploads = [...results.values()];
    if (!uploads.length) throw new Error("No Blossom server accepted the attachment");
    return { url: uploads[0].url, fallback: uploads.slice(1).map((upload) => upload.url) };
  };
}
