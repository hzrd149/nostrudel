import { getBlobUrls } from "blossom-client-sdk/actions/resolve";

/** Resolve URI server/author hints first, then the containing event author's servers. */
export async function getContentBlobUrls(
  uri: string,
  getServers: (pubkey: string) => Promise<(string | URL)[] | undefined> | undefined,
  owner?: string,
) {
  const fallbackServers = owner ? await getServers(owner) : undefined;
  const urls = await getBlobUrls(uri, { getServers: async (pubkey) => getServers(pubkey), fallbackServers });
  return urls.filter((url) => URL.canParse(url) && ["http:", "https:"].includes(new URL(url).protocol));
}
