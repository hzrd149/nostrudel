import { Input, InputProps } from "@chakra-ui/react";
import { forwardRef } from "react";
import { useAsync } from "react-use";
import { nip19 } from "nostr-tools";

import { useUserSearchDirectoryContext } from "../providers/global/user-directory-provider";
import userMetadataService from "../services/user-metadata";
import { getDisplayName } from "../helpers/nostr/user-metadata";
import useAppSettings from "../hooks/use-app-settings";

const NpubAutocomplete = forwardRef<HTMLInputElement, InputProps>(({ value, ...props }, ref) => {
  const getDirectory = useUserSearchDirectoryContext();
  const { removeEmojisInUsernames } = useAppSettings();

  const { value: users } = useAsync(async () => {
    const dir = await getDirectory();
    return dir.map(({ pubkey }) => ({ pubkey, metadata: userMetadataService.getSubject(pubkey).value }));
  }, [getDirectory]);

  return (
    <>
      <Input placeholder="npub..." list="users" value={value} {...props} ref={ref} />
      {users && (
        <datalist id="users">
          {users
            .filter((p) => !!p.metadata)
            .map(({ metadata, pubkey }) => (
              <option key={pubkey} value={nip19.npubEncode(pubkey)}>
                {getDisplayName(metadata, pubkey, removeEmojisInUsernames)}
              </option>
            ))}
        </datalist>
      )}
    </>
  );
});

export default NpubAutocomplete;
