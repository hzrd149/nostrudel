import { Button, Flex, Image, Link, Spacer } from "@chakra-ui/react";
import { Navigate, Link as RouterLink } from "react-router-dom";

import { useCurrentAccount } from "../../hooks/use-current-account";
import { ExternalLinkIcon } from "../../components/icons";
import VerticalPageLayout from "../../components/vertical-page-layout";

function BadgesPage() {
  const account = useCurrentAccount()!;

  return (
    <VerticalPageLayout>
      <Flex gap="2" wrap="wrap">
        <Button as={RouterLink} to="/badges/browse">
          Browse Badges
        </Button>
        <Spacer />
        <Button
          as={Link}
          href="https://badges.page/"
          isExternal
          rightIcon={<ExternalLinkIcon />}
          leftIcon={<Image src="https://badges.page/favicon.ico" w="1.2em" />}
        >
          Badges
        </Button>
      </Flex>
    </VerticalPageLayout>
  );
}

export default function BadgesView() {
  const account = useCurrentAccount();
  return account ? <BadgesPage /> : <Navigate to="/lists/browse" />;
}
