import { FlexProps } from "@chakra-ui/react";
import { getConversationParticipants } from "applesauce-common/helpers";
import { use$ } from "applesauce-react/hooks";
import { useState } from "react";
import localSettings from "../../../../services/preferences";
import ExpirationToggleButton from "../../components/expiration-toggle-button";
import WrappedComposer from "../../components/wrapped-composer";

export default function GroupMessageForm({
  group,
  initialExpiration,
}: { group: string; initialExpiration?: number } & Omit<FlexProps, "children">) {
  const defaultExpiration = use$(localSettings.defaultMessageExpiration);
  const [expiration, setExpiration] = useState<number | null>(initialExpiration ?? defaultExpiration);
  return (
    <WrappedComposer
      recipients={getConversationParticipants(group)}
      expiration={expiration}
      controls={<ExpirationToggleButton value={expiration} onChange={setExpiration} variant="ghost" />}
    />
  );
}
