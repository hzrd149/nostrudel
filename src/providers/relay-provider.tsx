import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import settingsService from "../services/settings";

const relaysContext = createContext({
  relays: [] as string[],
  loading: true,
  overwriteRelays: (urls: string[]) => {},
});

export function useRelays() {
  return useContext(relaysContext);
}

export const RelaysProvider = ({ children }: { children: React.ReactNode }) => {
  const [relays, setRelays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const update = useCallback(async () => {
    setRelays(await settingsService.getRelays());
    setLoading(false);
  }, [setRelays]);

  const overwriteRelays = useCallback(
    async (urls: string[]) => {
      if (urls) await settingsService.setRelays(urls);
      await update();
    },
    [update]
  );

  useEffect(() => {
    update();
  }, [update]);

  return (
    <relaysContext.Provider
      value={{
        relays,
        loading,
        overwriteRelays,
      }}
    >
      {children}
    </relaysContext.Provider>
  );
};
