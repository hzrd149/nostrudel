import { useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type Actions<T> = {
  setValue: (v: T | ((v: T | undefined) => T)) => void;
  clearValue: () => void;
};

export default function useRouteStateValue<T extends unknown>(key: string, fallback: T): { value: T } & Actions<T>;
export default function useRouteStateValue<T extends unknown>(
  key: string,
  fallback?: T,
): { value: T | undefined } & Actions<T>;
export default function useRouteStateValue<T extends unknown>(key: string, fallback?: T) {
  const navigate = useNavigate();
  const location = useLocation();

  const stateRef = useRef<Record<string, any>>(location.state ?? {});
  stateRef.current = location.state ?? {};
  const valueRef = useRef<T>(stateRef.current[key] ?? fallback);
  valueRef.current = stateRef.current[key] ?? fallback;

  const setValue = useCallback(
    (valueOrSetter: T | ((v: T) => T)) => {
      const newState = { ...stateRef.current };
      if (typeof valueOrSetter === "function") {
        // @ts-ignore
        newState[key] = valueOrSetter(valueRef.current);
      } else newState[key] = valueOrSetter;

      if (stateRef.current[key] !== newState[key]) {
        navigate(".", { state: newState, replace: true });
      }
    },
    [key],
  );
  const clearValue = useCallback(() => {
    const newState = { ...stateRef.current };
    delete newState[key];
    navigate(".", newState);
  }, [key]);

  return { value: valueRef.current, setValue, clearValue };
}

export function useRouteStateBoolean(key: string, fallback?: boolean) {
  const stateValue = useRouteStateValue<boolean>(key, fallback ?? false);

  const onOpen = useCallback(() => {
    stateValue.setValue(true);
  }, [stateValue.setValue]);
  const onClose = useCallback(() => {
    stateValue.setValue(false);
  }, [stateValue.setValue]);
  const onToggle = useCallback(() => {
    stateValue.setValue((v) => !v);
  }, [stateValue.setValue]);

  return { isOpen: stateValue.value, onOpen, onClose, onToggle };
}
