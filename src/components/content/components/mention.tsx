import { ComponentMap } from "applesauce-react/hooks";

import UserLink from "../../user/user-link";
import { EmbedEventPointerCard } from "../../embed-event/card";
import { EmbedEventPointerLink } from "../../embed-event/link";

export const NostrMentionCard: ComponentMap["mention"] = ({ node }) => {
  switch (node.decoded.type) {
    case "npub":
      return <UserLink showAt pubkey={node.decoded.data} color="blue.500" />;
    case "nprofile":
      return <UserLink showAt pubkey={node.decoded.data.pubkey} color="blue.500" />;
    case "nevent":
    case "naddr":
    case "note":
      return <EmbedEventPointerCard pointer={node.decoded} zIndex={1} />;

    default:
      return null;
  }
};

export const NostrMentionLink: ComponentMap["mention"] = ({ node }) => {
  switch (node.decoded.type) {
    case "npub":
      return <UserLink showAt pubkey={node.decoded.data} color="blue.500" />;
    case "nprofile":
      return <UserLink showAt pubkey={node.decoded.data.pubkey} color="blue.500" />;
    case "nevent":
    case "naddr":
    case "note":
      return <EmbedEventPointerLink pointer={node.decoded} zIndex={1} />;

    default:
      return null;
  }
};
