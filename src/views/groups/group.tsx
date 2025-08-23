import { Avatar, ButtonGroup, Flex, Text } from "@chakra-ui/react";
import { decodeGroupPointer, GroupPointer } from "applesauce-core/helpers";
import { useEventModel } from "applesauce-react/hooks";
import { Navigate, useParams } from "react-router-dom";

import DebugEventButton from "../../components/debug-modal/debug-event-button";
import SimpleView from "../../components/layout/presets/simple-view";
import { useAppTitle } from "../../hooks/use-app-title";
import { GroupInfoQuery } from "../../models/group";
import GroupChatLog from "./components/group-chat-log";
import GroupMessageForm from "./components/group-message-form";

function GroupPage({ group }: { group: GroupPointer }) {
  const info = useEventModel(GroupInfoQuery, [group]);

  const title = `${info?.name || group.name || group.id} - ${new URL(group.relay).hostname}`;
  useAppTitle(title);

  return (
    <SimpleView
      scroll={false}
      flush
      title={
        <Flex gap="2" alignItems="center">
          {info?.picture && <Avatar src={info?.picture} size="sm" />}
          <Text>{title}</Text>
        </Flex>
      }
      actions={
        <ButtonGroup size="sm" ms="auto">
          {info && <DebugEventButton event={info.event} variant="ghost" />}
        </ButtonGroup>
      }
    >
      <Flex direction="column-reverse" p="4" gap={2} flexGrow={1} h={0} overflowX="hidden" overflowY="auto">
        <GroupChatLog group={group} />
      </Flex>

      <GroupMessageForm group={group} px="2" pb="2" />
    </SimpleView>
  );
}

export default function GroupView() {
  const { identifier } = useParams();
  if (!identifier) return <Navigate to="/groups" />;

  const pointer = decodeGroupPointer(identifier);
  return <GroupPage group={pointer} />;
}
