import { lazy } from "react";
import { Center } from "@chakra-ui/react";
import { RouteObject } from "react-router";

const DirectMessagesView = lazy(() => import("."));
const DirectMessageChatView = lazy(() => import("./chat"));

export default [
  {
    Component: DirectMessagesView,
    children: [
      { index: true, element: <Center>select conversation</Center> },
      { path: ":pubkey", element: <DirectMessageChatView /> },
    ],
  },
] satisfies RouteObject[];
