import { Heading } from "@chakra-ui/react";
import { Navigate, useParams } from "react-router-dom";

import VerticalPageLayout from "../../components/vertical-page-layout";
import useSubject from "../../hooks/use-subject";
import { getWebOfTrust } from "../../services/web-of-trust";
import WikiPageResult from "./components/wiki-page-result";
import useWikiTopicTimeline from "./hooks/use-wiki-topic-timeline";

export default function WikiTopicView() {
  const { topic } = useParams();
  if (!topic) return <Navigate to="/wiki" />;

  const timeline = useWikiTopicTimeline(topic);

  const pages = useSubject(timeline.timeline).filter((p) => p.content.length > 0);
  const sorted = getWebOfTrust().sortByDistanceAndConnections(pages, (p) => p.pubkey);

  return (
    <VerticalPageLayout>
      <Heading>{topic}</Heading>

      {sorted.map((page) => (
        <WikiPageResult key={page.id} page={page} />
      ))}
    </VerticalPageLayout>
  );
}
