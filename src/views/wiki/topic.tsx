import { Heading, Link } from "@chakra-ui/react";
import { Navigate, useParams, Link as RouterLink } from "react-router-dom";

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

      {sorted.length === 0 && (
        <Heading mx="auto" size="md" mt="8">
          Looks like there are no pages,{" "}
          <Link as={RouterLink} to={{ pathname: "/wiki/create", search: "topic=" + topic }} color="blue.500">
            Create one?
          </Link>
        </Heading>
      )}
    </VerticalPageLayout>
  );
}
