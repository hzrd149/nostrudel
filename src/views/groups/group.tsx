import { Alert, AlertIcon, AlertTitle, Avatar, Flex, Text } from "@chakra-ui/react";
import { decodeGroupPointer, GroupPointer } from "applesauce-core/helpers";
import { useEventModel } from "applesauce-react/hooks";
import { Navigate, useParams } from "react-router-dom";
import ContainedSimpleView from "../../components/layout/presets/contained-simple-view";
import { GroupInfoQuery } from "../../models/group";
import { useAppTitle } from "../../hooks/use-app-title";
import DebugEventButton from "../../components/debug-modal/debug-event-button";

function GroupPage({ group }: { group: GroupPointer }) {
  const info = useEventModel(GroupInfoQuery, [group]);

  const title = `${info?.name || group.name || group.id} - ${new URL(group.relay).hostname}`;
  useAppTitle(title);

  return (
    <ContainedSimpleView
      title={
        <Flex gap="2" align="center">
          {info?.picture && <Avatar src={info?.picture} size="sm" />}
          <Text>{title}</Text>
        </Flex>
      }
      actions={info && <DebugEventButton event={info.event} ms="auto" variant="ghost" />}
    >
      <Alert status="info">
        <AlertIcon />
        <AlertTitle>Work in progress</AlertTitle>
      </Alert>
    </ContainedSimpleView>
  );
}

export default function GroupView() {
  const { identifier } = useParams();
  if (!identifier) return <Navigate to="/groups" />;

  const pointer = decodeGroupPointer(identifier);
  return <GroupPage group={pointer} />;
}
