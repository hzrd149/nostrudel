import { Avatar, Box, Flex, Heading } from "@chakra-ui/react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import useSubject from "../../hooks/use-subject";
import accountService from "../../services/account";

export const LoginView = () => {
  const current = useSubject(accountService.current);
  const location = useLocation();

  if (current) return <Navigate to={location.state?.from ?? "/"} replace />;

  return (
    <Flex
      direction="column"
      alignItems="center"
      justifyContent="center"
      gap="4"
      height="100%"
      padding="4"
      overflowX="hidden"
      overflowY="auto"
    >
      <Avatar src="/apple-touch-icon.png" size="lg" flexShrink={0} />
      <Heading>noStrudel</Heading>
      <Outlet />
    </Flex>
  );
};
