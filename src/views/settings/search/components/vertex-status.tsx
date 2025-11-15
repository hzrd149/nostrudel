import { Box, Button, Card, CardBody, Flex, Link, Stat, StatHelpText, StatLabel, StatNumber } from "@chakra-ui/react";
import { useObservableState } from "applesauce-react/hooks";

import { triggerBalance, vertextBalance$ } from "../../../../services/lookup/vertex";

export function VertexStatus() {
  const balance = useObservableState(vertextBalance$);

  if (balance === undefined) return null;

  return (
    <Card variant="outline">
      <CardBody>
        <Flex gap="3" align="center" justify="space-between" mb="3">
          <Box flex="1">
            <Stat>
              <StatLabel fontSize="sm">Credit Balance</StatLabel>
              <StatNumber fontSize="2xl">
                {balance !== null ? (
                  <>{balance.toLocaleString()} credits</>
                ) : (
                  <Box as="span" fontSize="sm" color="gray.500">
                    Click refresh to check balance
                  </Box>
                )}
              </StatNumber>
              <StatHelpText fontSize="xs">Available credits for Vertex searches</StatHelpText>
            </Stat>
          </Box>
          <Flex gap="2" direction="column">
            <Button size="sm" variant="outline" onClick={triggerBalance}>
              Refresh
            </Button>
            <Button
              as={Link}
              href="https://vertexlab.io/pricing/"
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              colorScheme="primary"
              _hover={{ textDecoration: "none" }}
            >
              Buy Credits
            </Button>
          </Flex>
        </Flex>
      </CardBody>
    </Card>
  );
}
