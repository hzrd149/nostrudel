import { useAsync } from "react-use";
import extractMetaTags from "../lib/open-graph-scraper/extract";
import { fetchWithCorsFallback } from "../helpers/cors";

export default function useOpenGraphData(url: URL) {
  return useAsync(async () => {
    try {
      const html = await fetchWithCorsFallback(url).then((res) => res.text());
      return extractMetaTags(html);
    } catch (e) {}
    return null;
  }, [url.toString()]);
}
