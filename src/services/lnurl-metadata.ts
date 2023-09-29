import { fetchWithCorsFallback } from "../helpers/cors";
import { getLudEndpoint } from "../helpers/lnurl";

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
    const url = getLudEndpoint(addressOrLNURL);
    if (!url) return;
    try {
      const metadata = await fetchWithCorsFallback(url).then(
        (res) => res.json() as Promise<LNURLError | LNURLPMetadata>,
      );
      if ((metadata as LNURLPMetadata).tag === "payRequest") {
        return metadata as LNURLPMetadata;
      }
    } catch (e) {}
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
