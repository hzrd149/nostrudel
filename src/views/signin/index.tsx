import { Avatar, Center, Flex, Heading } from "@chakra-ui/react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ReloadPrompt } from "../../components/reload-prompt";
import useSubject from "../../hooks/use-subject";
import accountService from "../../services/account";

export default function LoginView() {
  const current = useSubject(accountService.current);
  const location = useLocation();

  if (current) return <Navigate to={location.state?.from ?? "/"} replace />;

  return (
    <>
      <ReloadPrompt />
      <Center w="full" h="full">
        <Flex direction="column" alignItems="center" gap="2" maxW="sm" w="full" mx="4">
          <Avatar src="/apple-touch-icon.png" size="lg" flexShrink={0} />
          <Heading size="lg" mb="2">
            Sign in
          </Heading>
          <Outlet />
        </Flex>
      </Center>
    </>
  );
}
