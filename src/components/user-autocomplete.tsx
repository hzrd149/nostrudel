import { Input, InputProps } from "@chakra-ui/react";
import { forwardRef, useEffect, useState } from "react";
import { nip19 } from "nostr-tools";

import { useUserSearchDirectoryContext } from "../providers/global/user-directory-provider";
import userMetadataService from "../services/user-metadata";
import { getDisplayName, Kind0ParsedContent } from "../helpers/nostr/user-metadata";
import useAppSettings from "../hooks/use-app-settings";

type UserAutocompleteProps = InputProps & {
  hex?: boolean;
};

const UserAutocomplete = forwardRef<HTMLInputElement, UserAutocompleteProps>(({ value, hex, ...props }, ref) => {
  const getDirectory = useUserSearchDirectoryContext();
  const { removeEmojisInUsernames } = useAppSettings();

  const [users, setUsers] = useState<{ pubkey: string; names: string[]; metadata?: Kind0ParsedContent }[]>([]);

  useEffect(() => {
    const dir = getDirectory();

    setUsers(
      dir.map(({ pubkey, names }) => ({ pubkey, names, metadata: userMetadataService.getSubject(pubkey).value })),
    );
  }, [getDirectory]);

  return (
    <>
      <Input placeholder="Users" list="users" value={value} {...props} ref={ref} />
      {users && (
        <datalist id="users">
          {users.map(({ metadata, pubkey, names }) => (
            <option key={pubkey} value={hex ? pubkey : nip19.npubEncode(pubkey)}>
              {names[0] || getDisplayName(metadata, pubkey, removeEmojisInUsernames)}
            </option>
          ))}
        </datalist>
      )}
    </>
  );
});

export default UserAutocomplete;
