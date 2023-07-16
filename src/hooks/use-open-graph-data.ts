import { useAsync } from "react-use";
import extractMetaTags from "../lib/open-graph-scraper/extract";
import { fetchWithCorsFallback } from "../helpers/cors";
import { OgObjectInteral } from "../lib/open-graph-scraper/types";

const pageExtensions = [".html", ".php", "htm"];

const openGraphDataCache = new Map<string, OgObjectInteral>();

export default function useOpenGraphData(url: URL) {
  return useAsync(async () => {
    if (openGraphDataCache.has(url.toString())) return openGraphDataCache.get(url.toString());

    const ext = url.pathname.match(/\.[\w+d]+$/)?.[0];
    if (ext && !pageExtensions.includes(ext)) return null;

    try {
      const controller = new AbortController();
      const res = await fetchWithCorsFallback(url, { signal: controller.signal });
      const contentType = res.headers.get("content-type");

      if (contentType?.includes("text/html")) {
        const html = await res.text();
        const data = extractMetaTags(html);
        openGraphDataCache.set(url.toString(), data);
        return data;
      } else controller.abort();
    } catch (e) {}
    return null;
  }, [url.toString()]);
}
