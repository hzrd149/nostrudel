import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import settingsService from "../services/settings";

const relaysContext = createContext({
  relays: [],
  loading: true,
  overwriteRelays: () => {},
});

export function useRelays() {
  return useContext(relaysContext);
}

export const RelaysProvider = ({ children }) => {
  const [relays, setRelays] = useState([]);
  const [loading, setLoading] = useState(true);

  const update = useCallback(async () => {
    setRelays(await settingsService.getRelays());
    setLoading(false);
  }, [setRelays]);

  const overwriteRelays = useCallback(
    async (urls) => {
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
