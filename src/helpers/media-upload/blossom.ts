import { NostrEvent } from "nostr-tools";
import { safeUrl } from "../parse";
import { BlobDescriptor, BlossomClient, Signer } from "blossom-client-sdk";

export function getServersFromEvent(event: NostrEvent) {
  return event.tags
    .filter((t) => t[0] === "r")
    .map((t) => safeUrl(t[1]))
    .filter(Boolean) as string[];
}

export async function uploadFileToServers(servers: string[], file: File, signer: Signer) {
  const results: BlobDescriptor[] = [];

  const auth = await BlossomClient.getUploadAuth(file, signer);
  for (const server of servers) {
    try {
      results.push(await BlossomClient.uploadBlob(server, file, auth));
    } catch (e) {}
  }

  return results[0];
}
