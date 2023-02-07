import React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  PopoverCloseButton,
  PopoverAnchor,
  Button,
  UnorderedList,
  ListItem,
} from "@chakra-ui/react";
import { useAsync } from "react-use";
import { getRelaysEventWasSeen } from "../services/events-seen";

export const EventSeenOn = ({ id }: { id: string }) => {
  const { value } = useAsync(() => getRelaysEventWasSeen(id), [id]);

  if (!value) return null;
  const relays = value.relays;

  return (
    <Popover>
      <PopoverTrigger>
        <Button variant="link">
          Seen on {relays.length} relay{relays.length > 1 ? "s" : ""}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverArrow />
        <PopoverCloseButton />
        <PopoverBody>
          <UnorderedList>
            {relays.map((url) => (
              <ListItem key={url}>{url}</ListItem>
            ))}
          </UnorderedList>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};
