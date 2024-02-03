import { PropsWithChildren, createContext, useCallback, useContext } from "react";
import { useAsync } from "react-use";

import db from "../../services/db";

export type UserDirectory = { pubkey: string; names: [] }[];
export type GetDirectoryFn = () => UserDirectory;
const UserSearchDirectoryContext = createContext<GetDirectoryFn>(() => []);

export function useUserSearchDirectoryContext() {
  return useContext(UserSearchDirectoryContext);
}

export function AllUserSearchDirectoryProvider({ children }: PropsWithChildren) {
  const { value: users } = useAsync(() => db.getAll("userSearch"));
  const getDirectory = useCallback(() => users as UserDirectory, [users]);

  return <UserSearchDirectoryProvider getDirectory={getDirectory}>{children}</UserSearchDirectoryProvider>;
}

export default function UserSearchDirectoryProvider({
  children,
  getDirectory,
}: PropsWithChildren & { getDirectory: GetDirectoryFn }) {
  const parent = useContext(UserSearchDirectoryContext);
  const wrapper = useCallback<() => UserDirectory>(() => {
    const dir = parent ? parent() : [];
    const newDir = getDirectory();
    for (const pubkey of newDir) {
      if (!dir.includes(pubkey)) dir.push(pubkey);
    }
    return dir;
  }, [parent, getDirectory]);

  return <UserSearchDirectoryContext.Provider value={wrapper}>{children}</UserSearchDirectoryContext.Provider>;
}
