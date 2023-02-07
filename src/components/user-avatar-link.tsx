import { Tooltip } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useUserMetadata } from "../hooks/use-user-metadata";
import { UserAvatar } from "./user-avatar";

export type UserAvatarProps = {
  pubkey: string;
};
export const UserAvatarLink = ({ pubkey }: UserAvatarProps) => {
  const metadata = useUserMetadata(pubkey);

  let label = "Loading...";
  if (metadata?.display_name && metadata?.name) {
    label = `${metadata.display_name} (${metadata.name})`;
  } else if (metadata?.name) {
    label = metadata.name;
  } else {
    label = pubkey;
  }

  return (
    <Tooltip label={label}>
      <Link to={`/user/${pubkey}`}>
        <UserAvatar pubkey={pubkey} />
      </Link>
    </Tooltip>
  );
};
