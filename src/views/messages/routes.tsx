import { Center } from "@chakra-ui/react";
import { RouteObject } from "react-router-dom";
import DirectMessagesView from ".";
import DirectMessageChatView from "./chat";
import InboxView from "./inbox";

export default [
  {
    Component: DirectMessagesView,
    children: [
      { index: true, element: <Center>select conversation</Center> },
      { path: "inbox", element: <InboxView /> },
      { path: ":pubkey", element: <DirectMessageChatView /> },
    ],
  },
] satisfies RouteObject[];
