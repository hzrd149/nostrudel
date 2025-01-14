import { fetchWithProxy } from "../helpers/request";

class XmlFeedsService {
  parser = new DOMParser();
  feeds = new Map<string, Document>();

  private async loadFeed(url: string) {
    const str = await fetchWithProxy(url).then((res) => res.text());

    return this.parser.parseFromString(str, "application/xml");
  }

  async requestFeed(url: string | URL, force?: boolean): Promise<Document> {
    url = String(url);

    if (this.feeds.has(url) && !force) return this.feeds.get(url)!;

    const xml = await this.loadFeed(url);
    this.feeds.set(url, xml);
    return xml;
  }
}

export const xmlFeedsService = new XmlFeedsService();

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.xmlFeedsService = xmlFeedsService;
}
