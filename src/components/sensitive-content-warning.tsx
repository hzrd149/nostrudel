import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertProps,
  AlertTitle,
  Button,
  Spacer,
  useBreakpointValue,
  useModal,
} from "@chakra-ui/react";
import { useExpand } from "../providers/expanded";

export default function SensitiveContentWarning({ description }: { description: string } & AlertProps) {
  const expand = useExpand();
  const smallScreen = useBreakpointValue({ base: true, md: false });

  if (smallScreen) {
    return (
      <Alert
        status="warning"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        height="200px"
      >
        <AlertIcon boxSize="40px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="lg">
          Sensitive Content
        </AlertTitle>
        <AlertDescription maxWidth="sm">{description}</AlertDescription>
        <Button mt="2" onClick={expand?.onExpand} colorScheme="red">
          Show
        </Button>
      </Alert>
    );
  }

  return (
    <Alert status="warning">
      <AlertIcon boxSize="30px" mr="4" />
      <AlertTitle fontSize="lg">Sensitive Content</AlertTitle>
      <AlertDescription maxWidth="sm">{description}</AlertDescription>
      <Spacer />
      <Button mt="2" onClick={expand?.onExpand} colorScheme="red">
        Show
      </Button>
    </Alert>
  );
}
