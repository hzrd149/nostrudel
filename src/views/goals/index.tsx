import { Button, Center, Divider, Flex, Heading, Link, SimpleGrid, Spacer } from "@chakra-ui/react";
import { Navigate, Link as RouterLink } from "react-router-dom";

import useCurrentAccount from "../../hooks/use-current-account";
import { ExternalLinkIcon } from "../../components/icons";
import { getEventUID } from "../../helpers/nostr/events";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useSubject from "../../hooks/use-subject";
import GoalCard from "./components/goal-card";
import { GOAL_KIND } from "../../helpers/nostr/goal";
import VerticalPageLayout from "../../components/vertical-page-layout";

function UserGoalsManagerPage() {
  const account = useCurrentAccount()!;

  const readRelays = useReadRelayUrls();
  const timeline = useTimelineLoader(
    `${account.pubkey}-goals`,
    readRelays,
    {
      authors: [account.pubkey],
      kinds: [GOAL_KIND],
    },
    { enabled: !!account.pubkey },
  );

  const goals = useSubject(timeline.timeline);

  if (goals.length === 0) {
    return (
      <Center p="10" fontSize="lg" whiteSpace="pre">
        You don't have any goals,{" "}
        <Link as={RouterLink} to="/goals/browse" color="blue.500">
          Find a goal
        </Link>
        &nbsp;to support or{" "}
        <Link href="https://goals-silk.vercel.app/new" isExternal color="blue.500">
          Create one
        </Link>
      </Center>
    );
  }

  return (
    <>
      {goals.length > 0 && (
        <>
          <Heading size="md" mt="2">
            Created goals
          </Heading>
          <Divider />
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing="2">
            {goals.map((event) => (
              <GoalCard key={getEventUID(event)} goal={event} />
            ))}
          </SimpleGrid>
        </>
      )}
    </>
  );
}

export default function GoalsView() {
  const account = useCurrentAccount();

  return (
    <VerticalPageLayout>
      <Flex gap="2">
        <Button as={RouterLink} to="/goals/browse">
          Explore goals
        </Button>
        <Spacer />
        <Button as={Link} href="https://goals-silk.vercel.app/" isExternal rightIcon={<ExternalLinkIcon />}>
          Goal manager
        </Button>
      </Flex>

      {account ? <UserGoalsManagerPage /> : <Navigate to="/goals/browse" />}
    </VerticalPageLayout>
  );
}
