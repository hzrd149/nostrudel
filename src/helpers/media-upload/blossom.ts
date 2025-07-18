import { BlobDescriptor, createUploadAuth, ServerType, Signer } from "blossom-client-sdk";
import { multiServerUpload, MultiServerUploadOptions } from "blossom-client-sdk/actions/multi-server";
import localSettings from "../../services/preferences";

export async function simpleMultiServerUpload<T extends ServerType = ServerType>(
  servers: T[],
  file: File,
  signer: Signer,
  opts?: MultiServerUploadOptions<T, File>,
): Promise<BlobDescriptor> {
  const isMedia = file.type.startsWith("image/") || file.type.startsWith("video/");
  const auth = localSettings.alwaysAuthUpload.value || undefined;

  const results = await multiServerUpload(servers, file, {
    isMedia,
    mediaUploadBehavior: "any",
    mediaUploadFallback: true,
    auth,
    ...opts,
    onAuth: (_server, blob, type) => createUploadAuth(signer, blob, { type }),
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
