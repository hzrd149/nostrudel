import { BlobDescriptor, BlossomClient, Signer } from "blossom-client-sdk";

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
