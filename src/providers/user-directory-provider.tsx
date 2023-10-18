import { PropsWithChildren, createContext, useCallback, useContext } from "react";

import db from "../services/db";

export type UserDirectory = { pubkey: string; names: [] }[];
export type GetDirectoryFn = () => Promise<UserDirectory> | UserDirectory;
const UserSearchDirectoryContext = createContext<GetDirectoryFn>(async () => []);

export function useUserSearchDirectoryContext() {
  return useContext(UserSearchDirectoryContext);
}

// export function getNameDirectory(directory: UserDirectory) {
//   const people: { pubkey: string; names: string[] }[] = [];
//   for (const pubkey of directory) {
//     const metadata = userMetadataService.getSubject(pubkey).value;
//     if (!metadata) continue;
//     const names: string[] = [];
//     if (metadata.display_name) names.push(metadata.display_name);
//     if (metadata.name) names.push(metadata.name);
//     if (names.length > 0) {
//       people.push({ pubkey, names });
//     }
//   }
//   return people;
// }

// export function UserContactsUserDirectoryProvider({ children, pubkey }: PropsWithChildren & { pubkey?: string }) {
//   const account = useCurrentAccount();
//   const contacts = useUserContactList(pubkey || account?.pubkey);

//   const getDirectory = useCallback(async () => {
//     const people = contacts ? getPubkeysFromList(contacts).map((p) => p.pubkey) : [];
//     const directory: UserDirectory = [];

//     for (const pubkey of people) {
//       directory.push(pubkey);
//     }
//     return directory;
//   }, [contacts]);

//   return <UserDirectoryProvider getDirectory={getDirectory}>{children}</UserDirectoryProvider>;
// }

export function AllUserSearchDirectoryProvider({ children }: PropsWithChildren) {
  const getDirectory = useCallback(async () => {
    return await db.getAll("userSearch");
  }, []);

  return <UserSearchDirectoryProvider getDirectory={getDirectory}>{children}</UserSearchDirectoryProvider>;
}

export default function UserSearchDirectoryProvider({
  children,
  getDirectory,
}: PropsWithChildren & { getDirectory: GetDirectoryFn }) {
  const parent = useContext(UserSearchDirectoryContext);
  const wrapper = useCallback<() => Promise<UserDirectory>>(async () => {
    const dir = parent ? await parent() : [];
    const newDir = await getDirectory();
    for (const pubkey of newDir) {
      if (!dir.includes(pubkey)) dir.push(pubkey);
    }
    return dir;
  }, [parent, getDirectory]);

  return <UserSearchDirectoryContext.Provider value={wrapper}>{children}</UserSearchDirectoryContext.Provider>;
}
