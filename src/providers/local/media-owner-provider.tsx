import React, { PropsWithChildren, useContext } from "react";

const MediaOwnerContext = React.createContext<string | undefined>(undefined);

export function useMediaOwnerContext() {
  return useContext(MediaOwnerContext);
}

export default function MediaOwnerProvider({ children, owner }: PropsWithChildren & { owner?: string }) {
  return owner ? <MediaOwnerContext.Provider value={owner}>{children}</MediaOwnerContext.Provider> : children;
}
