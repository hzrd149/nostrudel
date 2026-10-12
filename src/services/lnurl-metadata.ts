import { parseLNURLOrAddress } from "applesauce-common/helpers";
import { logger } from "../helpers/debug";
import { fetchWithProxy } from "../helpers/request";

const log = logger.extend("LNURLMetadata");

type LNURLPMetadata = {
  callback: string;
  maxSendable: number;
  minSendable: number;
  metadata: string;
  commentAllowed?: number;
  tag: "payRequest";
  allowsNostr?: true;
  nostrPubkey?: string;
};
type LNURLError = {
  status: "error";
  message: string;
};

class LNURLMetadataService {
  private metadata = new Map<string, LNURLPMetadata>();
  private pending = new Map<string, Promise<LNURLPMetadata | undefined>>();

  private async fetchMetadata(addressOrLNURL: string) {
    const url = parseLNURLOrAddress(addressOrLNURL);
    if (!url) return;
    try {
      const metadata = await fetchWithProxy(url).then((res) => res.json() as Promise<LNURLError | LNURLPMetadata>);
      if ((metadata as LNURLPMetadata).tag === "payRequest") {
        return metadata as LNURLPMetadata;
      }
    } catch (e) {
      // The lookup failed, the caller receives no metadata
      log("Failed to fetch LNURL metadata", addressOrLNURL, e);
    }
    this.pending.delete(addressOrLNURL);
  }

  async requestMetadata(addressOrLNURL: string, alwaysFetch = false) {
    if (this.metadata.has(addressOrLNURL) && !alwaysFetch) {
      return this.metadata.get(addressOrLNURL);
    }
    if (this.pending.has(addressOrLNURL)) {
      return this.pending.get(addressOrLNURL);
    }
    const promise = this.fetchMetadata(addressOrLNURL);
    this.pending.set(addressOrLNURL, promise);
    return await promise;
  }
}

const lnurlMetadataService = new LNURLMetadataService();

export default lnurlMetadataService;
