import React from "react";
import { VStack, Heading } from "@chakra-ui/react";
import { Link } from "react-router-dom";

export const HomeView = () => {
  return (
    <VStack>
      <Heading>personal nostr client</Heading>
      <span>
        There are many benefits to a joint design and development system. Not
        only does it bring benefits to the design team, but it also brings
        benefits to engineering teams. It makes sure that our experiences have a
        consistent look and feel, not just in our design specs, but in
        production.
      </span>
      <Link to="/settings">Settings</Link>
      <Link to="/user/266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5">
        self
      </Link>
      <Link to="/user/6b0d4c8d9dc59e110d380b0429a02891f1341a0fa2ba1b1cf83a3db4d47e3964">
        gigi
      </Link>
    </VStack>
  );
};
