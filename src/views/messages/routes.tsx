import { Center } from "@chakra-ui/react";
import { RouteObject } from "react-router";
import DirectMessagesView from ".";
import DirectMessageChatView from "./chat";

export default [
  {
    Component: DirectMessagesView,
    children: [
      { index: true, element: <Center>select conversation</Center> },
      { path: ":pubkey", element: <DirectMessageChatView /> },
    ],
  },
] satisfies RouteObject[];
