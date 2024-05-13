import React, { PropsWithChildren, useContext } from "react";

const MediaOwnerContext = React.createContext<string | undefined>(undefined);

export function useMediaOwnerContext() {
  return useContext(MediaOwnerContext);
}

export function MediaOwnerProvider({ children, owner }: PropsWithChildren & { owner?: string }) {
  if (owner) return <MediaOwnerContext.Provider value={owner}>{children}</MediaOwnerContext.Provider>;
  else <>{children}</>;
}
