import { ReactNode, memo, useCallback } from "react";

import { NostrEvent } from "../../../types/nostr-event";
import MessageBlock, { MessageBlockProps } from "../../../components/message-block";
import ChannelMessageContent from "./channel-message-content";

function ChannelMessageBlock({ ...props }: Omit<MessageBlockProps, "renderContent">) {
  const renderContent = useCallback(
    (message: NostrEvent, buttons: ReactNode | null) => (
      <ChannelMessageContent message={message} display="inline">
        {buttons}
      </ChannelMessageContent>
    ),
    [],
  );

  return <MessageBlock renderContent={renderContent} showThreadButton={false} {...props} />;
}

export default memo(ChannelMessageBlock);
