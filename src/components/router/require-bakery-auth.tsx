import { PropsWithChildren, useEffect, useRef } from "react";
import { Button, Flex, Heading, Spinner } from "@chakra-ui/react";
import { To, useLocation, Link as RouterLink, useNavigate } from "react-router-dom";
import { useObservable } from "applesauce-react/hooks";

import { useSigningContext } from "../../providers/global/signing-provider";
import { bakery$ } from "../../services/bakery";

export default function RequireBakeryAuth({ children }: PropsWithChildren) {
  const location = useLocation();
  const bakery = useObservable(bakery$);
  const connected = useObservable(bakery?.connected$);
  const authenticated = useObservable(bakery?.authenticated$);
  const challenge = useObservable(bakery?.challenge$);
  const { requestSignature } = useSigningContext();
  const navigate = useNavigate();

  const loading = useRef(false);
  useEffect(() => {
    // wait for the personalNode to be connected and a challenge
    if (!bakery || !connected || authenticated || !challenge) return;

    if (loading.current) return;
    loading.current = true;

    // bakery
    //   .authenticate((draft) => requestSignature(draft))
    //   ?.catch(() => {
    //     navigate("/bakery/connect/auth", { state: { back: (location.state?.back ?? location) satisfies To } });
    //   })
    //   .finally(() => (loading.current = false));
  }, [connected, authenticated, challenge, bakery]);

  // initial auth UI
  if (!authenticated && connected)
    return (
      <Flex direction="column" gap="2" alignItems="center" justifyContent="center" h="full">
        <Flex gap="2" alignItems="center">
          <Spinner />
          <Heading size="md">Authenticating...</Heading>
        </Flex>
        <Button
          mt="2"
          variant="link"
          as={RouterLink}
          to="/bakery/connect/auth"
          state={{ back: (location.state?.back ?? location) satisfies To }}
        >
          Cancel
        </Button>
      </Flex>
    );

  return <>{children}</>;
}
