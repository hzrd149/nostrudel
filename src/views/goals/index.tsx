import { Button, Center, Divider, Flex, Heading, Link, SimpleGrid, Spacer } from "@chakra-ui/react";
import { Navigate, Link as RouterLink } from "react-router-dom";
import { getEventUID } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";

import { useActiveAccount } from "applesauce-react/hooks";
import { ExternalLinkIcon } from "../../components/icons";
import { useReadRelays } from "../../hooks/use-client-relays";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import GoalCard from "./components/goal-card";
import VerticalPageLayout from "../../components/vertical-page-layout";

function UserGoalsManagerPage() {
  const account = useActiveAccount()!;

  const readRelays = useReadRelays();
  const { timeline: goals } = useTimelineLoader(
    `${account.pubkey}-goals`,
    readRelays,
    account.pubkey
      ? {
          authors: [account.pubkey],
          kinds: [kinds.ZapGoal],
        }
      : undefined,
  );

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
      {goals && goals.length > 0 && (
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

export default function GoalsHomeView() {
  const account = useActiveAccount();

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
