import { Button, Flex, Heading } from "@chakra-ui/react";
import { Navigate, useLocation } from "react-router-dom";
import useSubject from "../hooks/use-subject";
import identity from "../services/identity";

export const SetupView = () => {
  const setup = useSubject(identity.setup);
  const location = useLocation();

  if (setup) return <Navigate to={location.state.from} replace />;

  return (
    <Flex direction="column" alignItems="center" justifyContent="center">
      <Heading>Setup</Heading>
      <Button onClick={() => identity.requestKeysFromWindow()}>
        Use browser extension
      </Button>
    </Flex>
  );
};
