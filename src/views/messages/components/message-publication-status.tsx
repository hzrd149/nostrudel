import { Flex, Text } from "@chakra-ui/react";
import type { PreparedMessage } from "../../../services/messaging/publication";
import UserName from "../../../components/user/user-name";

export default function MessagePublicationStatus({ pending }: { pending?: PreparedMessage }) {
  if (!pending) return null;
  return (
    <Flex direction="column" gap="2">
      {!("publications" in pending) && <Text>Waiting for relay acceptance</Text>}
      {"publications" in pending &&
        pending.publications.map((result) => (
          <Text key={result.recipient}>
            <UserName pubkey={result.recipient} />:{" "}
            {result.accepted ? "Accepted by relay" : result.error ? "Failed — retry available" : "Pending"}
          </Text>
        ))}
    </Flex>
  );
}
