import { useCallback, useRef } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

type Actions = {
  setValue: (v: string | null | ((v: string | null) => string | null), replace?: boolean) => void;
  clearValue: (replace?: boolean) => void;
};

export default function useRouteSearchValue(key: string): { value: string | null } & Actions;
export default function useRouteSearchValue(key: string, fallback: string): { value: string } & Actions;
export default function useRouteSearchValue(key: string, fallback?: string): { value: string | null } & Actions;
export default function useRouteSearchValue(key: string, fallback?: string) {
  const [params, setParams] = useSearchParams();
  const location = useLocation();

  const paramsRef = useRef<URLSearchParams>(params);
  paramsRef.current = params;

  const stateRef = useRef(location.state);
  stateRef.current = location.state;

  const setValue = useCallback<Actions["setValue"]>(
    (valueOrSetter, replace = true) => {
      const newParams = new URLSearchParams(paramsRef.current);

      let value: string | null;
      if (typeof valueOrSetter === "function") {
        value = valueOrSetter(paramsRef.current.get(key));
      } else value = valueOrSetter;

      if (value === null) newParams.delete(key);
      else newParams.set(key, value);

      if (newParams.toString() !== paramsRef.current.toString()) {
        setParams(newParams, { state: stateRef.current, replace });
      }
    },
    [key],
  );
  const clearValue = useCallback<Actions["clearValue"]>(
    (replace = true) => {
      const newParams = new URLSearchParams(paramsRef.current);
      newParams.delete(key);
      if (newParams.toString() !== paramsRef.current.toString()) {
        setParams(newParams, { state: stateRef.current, replace });
      }
    },
    [key],
  );

  return { value: params.get(key) ?? fallback ?? null, setValue, clearValue };
}
