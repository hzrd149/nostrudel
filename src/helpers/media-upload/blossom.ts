import { BlobDescriptor, createUploadAuth, ServerType, Signer } from "blossom-client-sdk";
import {
  multiServerMediaUpload,
  MultiServerMediaUploadOptions,
  multiServerUpload,
  MultiServerUploadOptions,
} from "blossom-client-sdk/actions/multi-server";
import localSettings from "../../services/preferences";

export async function simpleMultiServerUpload<T extends ServerType = ServerType>(
  servers: T[],
  file: File,
  signer: Signer,
  opts?: MultiServerMediaUploadOptions<T, File>,
): Promise<BlobDescriptor> {
  const isMedia = file.type.startsWith("image/") || file.type.startsWith("video/");
  const auth = localSettings.alwaysAuthUpload.value || undefined;

  const onAuth: MultiServerUploadOptions<T, File>["onAuth"] = (_server, sha256, authType) =>
    createUploadAuth(signer, sha256, { type: authType });

  const results = isMedia
    ? await multiServerMediaUpload(servers, file, {
        mediaUploadBehavior: "any",
        mediaUploadFallback: true,
        auth,
        ...opts,
        onAuth,
      })
    : await multiServerUpload(servers, file, {
        auth,
        ...opts,
        onAuth,
      });

  let blob: BlobDescriptor | null = null;

  for (const server of servers) {
    if (results.has(server)) {
      blob = results.get(server)!;
      break;
    }
  }
  if (!blob) throw new Error("Failed to upload");

  return blob;
}
