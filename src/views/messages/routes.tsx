import { Center } from "@chakra-ui/react";
import { RouteObject } from "react-router-dom";
import InboxView from "./inbox";
import DirectMessagesView from ".";
import DirectMessageChatView from "./chat/index";
import DirectMessageGroupView from "./group/index";

export default [
  {
    Component: DirectMessagesView,
    children: [
      { index: true, element: <Center>select conversation</Center> },
      { path: "inbox", element: <InboxView /> },
      { path: "group/:group", element: <DirectMessageGroupView /> },
      { path: ":pubkey", element: <DirectMessageChatView /> },
    ],
  },
] satisfies RouteObject[];
