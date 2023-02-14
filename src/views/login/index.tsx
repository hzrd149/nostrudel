import { Avatar, Box, Flex, Heading } from "@chakra-ui/react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useSubject from "../../hooks/use-subject";
import accountService from "../../services/account";

export const LoginView = () => {
  const setup = useSubject(accountService.setup);
  const location = useLocation();

  if (setup) return <Navigate to={location.state?.from ?? "/"} replace />;

  return (
    <Flex direction="column" alignItems="center" justifyContent="center" gap="4" height="80%" px="4">
      <Avatar src="/apple-touch-icon.png" size="lg" />
      <Heading>noStrudel</Heading>
      <Outlet />
    </Flex>
  );
};
