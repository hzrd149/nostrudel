import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Flex, FlexProps, Progress } from "@chakra-ui/react";
import NostrPublishAction from "../classes/nostr-publish-action";
import useSubject from "../hooks/use-subject";

export type PostResultsProps = {
  pub: NostrPublishAction;
};

export const PublishDetails = ({ pub }: PostResultsProps & Omit<FlexProps, "children">) => {
  const results = useSubject(pub.results);

  return (
    <Flex direction="column" gap="2">
      <Progress value={(results.length / pub.relays.length) * 100} size="lg" hasStripe />
      {results.map((result) => (
        <Alert key={result.relay.url} status={result.status ? "success" : "warning"}>
          <AlertIcon />
          <Box>
            <AlertTitle>{result.relay.url}</AlertTitle>
            {result.message && <AlertDescription>{result.message}</AlertDescription>}
          </Box>
        </Alert>
      ))}
    </Flex>
  );
};
