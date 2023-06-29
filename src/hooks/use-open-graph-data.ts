import { useAsync } from "react-use";
import extractMetaTags from "../lib/open-graph-scraper/extract";
import { fetchWithCorsFallback } from "../helpers/cors";

const pageExtensions = [".html", ".php", "htm"];

export default function useOpenGraphData(url: URL) {
  return useAsync(async () => {
    const controller = new AbortController();
    const ext = url.pathname.match(/\.[\w+d]+$/)?.[0];
    if (ext && !pageExtensions.includes(ext)) return null;

    try {
      const res = await fetchWithCorsFallback(url, { signal: controller.signal });
      const contentType = res.headers.get("content-type");

      if (contentType?.includes("text/html")) {
        const html = await res.text();
        return extractMetaTags(html);
      } else controller.abort();
    } catch (e) {}
    return null;
  }, [url.toString()]);
}
