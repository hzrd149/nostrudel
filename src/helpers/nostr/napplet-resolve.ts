import {
  NappletResolutionError,
  verifyBlobHash,
  verifyManifestSignature,
  type ResolveNappletOptions,
  type ResolvedNapplet,
} from "@kehto/nip";

import { parseNappletManifest } from "./napplets";

const INDEX_PATHS = ["/index.html", "index.html", "/"];

/**
 * Resolves a napplet manifest into verified file bytes. Mirrors `resolveNapplet` from `@kehto/nip`
 * but uses the permissive local manifest parser, so single-file NIP-5D manifests load. The
 * signature and every blob hash are still verified; a legacy declared aggregate that does not
 * match its paths is tolerated because each blob is checked individually.
 */
export async function resolveNapplet({
  event,
  fetchBlob,
  textDecode = (bytes) => new TextDecoder().decode(bytes),
  cache,
}: ResolveNappletOptions): Promise<ResolvedNapplet> {
  if (!verifyManifestSignature(event)) {
    throw new NappletResolutionError("invalid-signature", "manifest signature is invalid");
  }

  const manifest = parseNappletManifest(event);
  const files = new Map<string, Uint8Array>();

  for (const entry of manifest.paths) {
    let bytes = await cache?.readBlob(entry.sha256);
    if (bytes && !verifyBlobHash(bytes, entry.sha256)) {
      await cache?.deleteBlob(entry.sha256);
      bytes = undefined;
    }

    bytes ??= await fetchBlob(entry.sha256, manifest.servers);
    if (!verifyBlobHash(bytes, entry.sha256)) {
      throw new NappletResolutionError(
        "blob-hash-mismatch",
        `blob for ${entry.path} does not match hash ${entry.sha256}`,
      );
    }

    files.set(entry.path, bytes);
  }

  const indexEntry = manifest.paths.find((entry) => INDEX_PATHS.includes(entry.path));
  if (!indexEntry) throw new NappletResolutionError("missing-index", "manifest has no /index.html entry");

  const indexHtml = textDecode(files.get(indexEntry.path)!);
  await cache?.writeVerifiedResolution({ event, manifest, files, indexHtml });

  return { dTag: manifest.dTag, aggregateHash: manifest.aggregateHash, files, indexHtml, manifest };
}
