import { Input, InputProps } from "@chakra-ui/react";
import { forwardRef } from "react";
import { useObservable } from "applesauce-react/hooks";
import { nip19 } from "nostr-tools";

import { userSearchDirectory } from "../services/username-search";

type UserAutocompleteProps = InputProps & {
  hex?: boolean;
};

const UserAutocomplete = forwardRef<HTMLInputElement, UserAutocompleteProps>(({ value, hex, ...props }, ref) => {
  const directory = useObservable(userSearchDirectory);

  return (
    <>
      <Input placeholder="Users" list="users" value={value} {...props} ref={ref} />
      {directory && (
        <datalist id="users">
          {directory.map(({ pubkey, names }) => (
            <option key={pubkey} value={hex ? pubkey : nip19.npubEncode(pubkey)}>
              {names[0]}
            </option>
          ))}
        </datalist>
      )}
    </>
  );
});

export default UserAutocomplete;
