import { PropsWithChildren, createContext, useCallback, useContext } from "react";

import { useCurrentAccount } from "../hooks/use-current-account";
import useUserContactList from "../hooks/use-user-contact-list";
import { getPubkeysFromList } from "../helpers/nostr/lists";

export type UserDirectory = string[];
export type GetDirectoryFn = () => Promise<UserDirectory> | UserDirectory;
const UserDirectoryContext = createContext<GetDirectoryFn>(async () => []);

export function useUserDirectoryContext() {
  return useContext(UserDirectoryContext);
}

export function UserContactsUserDirectoryProvider({ children, pubkey }: PropsWithChildren & { pubkey?: string }) {
  const account = useCurrentAccount();
  const contacts = useUserContactList(pubkey || account?.pubkey);

  const getDirectory = useCallback(async () => {
    const people = contacts ? getPubkeysFromList(contacts).map((p) => p.pubkey) : [];
    const directory: UserDirectory = [];

    for (const pubkey of people) {
      directory.push(pubkey);
    }
    return directory;
  }, [contacts]);

  return <UserDirectoryProvider getDirectory={getDirectory}>{children}</UserDirectoryProvider>;
}

export default function UserDirectoryProvider({
  children,
  getDirectory,
}: PropsWithChildren & { getDirectory: GetDirectoryFn }) {
  const parent = useContext(UserDirectoryContext);
  const wrapper = useCallback<() => Promise<UserDirectory>>(async () => {
    const dir = parent ? await parent() : [];
    const newDir = await getDirectory();
    for (const pubkey of newDir) {
      if (!dir.includes(pubkey)) dir.push(pubkey);
    }
    return dir;
  }, [parent, getDirectory]);

  return <UserDirectoryContext.Provider value={wrapper}>{children}</UserDirectoryContext.Provider>;
}
