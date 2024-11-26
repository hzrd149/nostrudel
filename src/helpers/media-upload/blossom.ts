import { BlobDescriptor, createUploadAuth, ServerType, Signer } from "blossom-client-sdk";
import { multiServerUpload, MultiServerUploadOptions } from "blossom-client-sdk/actions/upload";

export async function simpleMultiServerUpload<T extends ServerType = ServerType>(
  servers: T[],
  file: File,
  signer: Signer,
  opts?: MultiServerUploadOptions<T, File>,
): Promise<BlobDescriptor> {
  const results = await multiServerUpload(servers, file, {
    ...opts,
    onAuth: (_server, blob) => createUploadAuth(signer, blob),
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
