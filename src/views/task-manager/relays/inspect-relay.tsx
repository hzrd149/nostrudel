import { Flex, Heading, Spacer } from "@chakra-ui/react";
import { Navigate, useParams } from "react-router-dom";

import BackButton from "../../../components/router/back-button";
import VerticalPageLayout from "../../../components/vertical-page-layout";

import { RelayAuthIconButton } from "../../../components/relays/relay-auth-icon-button";
import RelayStatusBadge from "../../../components/relays/relay-status";

export default function InspectRelayView() {
  const { relay } = useParams();
  if (!relay) return <Navigate to="/" />;

  return (
    <VerticalPageLayout>
      <Flex gap="2" alignItems="center" wrap="wrap">
        <BackButton size="sm" />
        <Heading size="md">{relay}</Heading>
        <RelayStatusBadge relay={relay} />
        <Spacer />
        <RelayAuthIconButton relay={relay} size="sm" variant="ghost" />
      </Flex>
    </VerticalPageLayout>
  );
}
