import { Alert, AlertDescription, AlertIcon, AlertTitle, Button } from "@chakra-ui/react";

import { ErrorBoundary } from "../../components/error-boundary";
import ContainedParentView from "../../components/layout/presets/contained-parent-view";
import RouterLink from "../../components/router-link";
import useUserGroupsList from "../../hooks/use-user-groups-list";
import { encodeGroupPointer } from "applesauce-core/helpers/groups";
import SimpleNavItem from "../../components/layout/presets/simple-nav-item";

export default function ChannelsHomeView() {
  const { pointers } = useUserGroupsList();

  return (
    <ContainedParentView
      title="Groups"
      path="/groups"
      width="sm"
      actions={
        <Button as={RouterLink} to="explore" ms="auto" size="sm">
          Explore
        </Button>
      }
    >
      {pointers?.map((pointer) => (
        <SimpleNavItem to={`/groups/${encodeGroupPointer(pointer)}`} key={pointer.relay + pointer.id}>
          {encodeGroupPointer(pointer)}
        </SimpleNavItem>
      ))}

      {pointers.length === 0 && (
        <Alert
          status="info"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            No groups
          </AlertTitle>
          <AlertDescription maxWidth="sm">Looks like you have not joined any groups.</AlertDescription>
          <Button as={RouterLink} to="explore" variant="link" p="2">
            Explore
          </Button>
        </Alert>
      )}
    </ContainedParentView>
  );
}
