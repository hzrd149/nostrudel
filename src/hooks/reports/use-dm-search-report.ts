import { useObservable } from "applesauce-react/hooks";

import useReport from "../use-report";

export default function useDMSearchReport(
  query: string,
  filter?: { conversation?: [string, string]; order?: "rank" | "created_at" },
) {
  const enabled = query.length >= 3;

  const report = useReport(
    "DM_SEARCH",
    enabled ? `dn-search-${query}` : undefined,
    enabled ? { query, conversation: filter?.conversation, order: filter?.order } : undefined,
  );

  const messages = useObservable(report?.results);
  const conversations = useObservable(report?.conversations);

  return { messages, conversations };
}
