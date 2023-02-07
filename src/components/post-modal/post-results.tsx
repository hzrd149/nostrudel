import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Flex, Heading } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { PostResult } from "../../classes/nostr-post-action";
import { NostrEvent } from "../../types/nostr-event";

export type PostResultsProps = {
  event: NostrEvent;
  results: PostResult[];
  onClose: () => void;
};

export const PostResults = ({ event, results, onClose }: PostResultsProps) => {
  const navigate = useNavigate();

  const viewPost = () => {
    onClose();
    navigate(`/n/${event.id}`);
  };

  return (
    <Flex direction="column" gap="2">
      <Heading size="md">Posted to relays:</Heading>
      {results.map((result) => (
        <Alert key={result.url} status={result.status ? "success" : "warning"}>
          <AlertIcon />
          <Box>
            <AlertTitle>{result.url}</AlertTitle>
            {result.message && <AlertDescription>{result.message}</AlertDescription>}
          </Box>
        </Alert>
      ))}
      <Flex gap="4" ml="auto">
        <Button onClick={viewPost} variant="link">
          View Post
        </Button>
        <Button onClick={onClose}>Done</Button>
      </Flex>
    </Flex>
  );
};
