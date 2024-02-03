import { PropsWithChildren, createContext, useCallback, useContext, useMemo } from "react";
import useRouteStateValue from "../../hooks/use-route-state-value";

type KindSelectionContextType = {
  kinds: number[];
  toggleKind: (k: number) => void;
  addKind: (k: number) => void;
  removeKind: (k: number) => void;
  setKinds: (kinds: number[] | ((kinds: number[]) => number[])) => void;
};
const KindSelectionContext = createContext<KindSelectionContextType>({
  kinds: [],
  toggleKind: () => {},
  addKind: () => {},
  removeKind: () => {},
  setKinds: () => {},
});

export function useKindSelectionContext() {
  return useContext(KindSelectionContext);
}

export default function KindSelectionProvider({
  children,
  initKinds = [],
}: PropsWithChildren<{ initKinds?: number[] }>) {
  const { value: kinds, setValue } = useRouteStateValue("kinds", initKinds);

  const addKind = useCallback(
    (k: number) => setValue((kinds = []) => (!kinds.includes(k) ? kinds.concat(k) : kinds)),
    [setValue],
  );
  const removeKind = useCallback(
    (k: number) => setValue((kinds = []) => (kinds.includes(k) ? kinds.filter((v) => v !== k) : kinds)),
    [setValue],
  );
  const toggleKind = useCallback(
    (k: number) => setValue((kinds = []) => (kinds.includes(k) ? kinds.filter((v) => v !== k) : kinds.concat(k))),
    [setValue],
  );
  const setKinds = useCallback(
    (kinds: number[] | ((kinds: number[]) => number[])) => {
      setValue((v) => {
        if (typeof kinds === "function") return kinds(v || []);
        else return kinds;
      });
    },
    [setValue],
  );

  const context = useMemo(
    () => ({ kinds, setKinds, addKind, removeKind, toggleKind }),
    [kinds, setKinds, addKind, removeKind, toggleKind],
  );

  return <KindSelectionContext.Provider value={context}>{children}</KindSelectionContext.Provider>;
}
