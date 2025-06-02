import { useState } from "react";
import { ButtonProps, useToast } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { Emoji } from "applesauce-core/helpers";
import { useEventFactory } from "applesauce-react/hooks";

import { usePublishEvent } from "../../../../providers/global/publish-provider";
import SelectReactionButton from "../../../reactions/select-reaction-button";

export default function AddReactionButton({
  event,
}: { event: NostrEvent; portal?: boolean } & Omit<ButtonProps, "children">) {
  const factory = useEventFactory();
  const toast = useToast();
  const publish = usePublishEvent();

  const [loading, setLoading] = useState(false);
  const addReaction = async (emoji: string | Emoji) => {
    setLoading(true);
    try {
      const draft = await factory.reaction(event, emoji);
      await publish("Reaction", draft);
    } catch (error) {
      if (error instanceof Error) toast({ description: error.message, status: "error" });
    }
    setLoading(false);
  };
  return <SelectReactionButton onSelect={addReaction} isLoading={loading} portal />;
}
