import { ComponentMap } from "applesauce-react/hooks";

import UserLink from "../../user/user-link";
import { EmbedEventPointer } from "../../embed-event";

const Mention: ComponentMap["mention"] = ({ node }) => {
  switch (node.decoded.type) {
    case "npub":
      return <UserLink showAt pubkey={node.decoded.data} color="blue.500" />;
    case "nprofile":
      return <UserLink showAt pubkey={node.decoded.data.pubkey} color="blue.500" />;
    case "nevent":
    case "nrelay":
    case "naddr":
    case "note":
      return <EmbedEventPointer pointer={node.decoded} />;

    default:
      return null;
  }
};

export default Mention;
