import { useAsync } from "react-use";
import { xmlFeedsService } from "../services/xml-feeds";

export default function useFeedXML(url: string | URL, force?: boolean) {
  const { error, value, loading } = useAsync(() => xmlFeedsService.requestFeed(url, force), [String(url), force]);

  return { xml: value, error, loading };
}
