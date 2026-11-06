import { Center } from "@chakra-ui/react";
import { lazy } from "react";
import { RouteObject } from "react-router-dom";

const InboxView = lazy(() => import("./inbox"));
const DirectMessagesView = lazy(() => import("."));
const DirectMessageChatView = lazy(() => import("./chat/index"));
const DirectMessageGroupView = lazy(() => import("./group/index"));

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
