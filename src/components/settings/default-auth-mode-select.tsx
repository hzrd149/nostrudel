import { Select, SelectProps } from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";

import { RelayAuthMode } from "../../services/authentication-signer";
import localSettings from "../../services/preferences";

export default function DefaultAuthModeSelect({ ...props }: Omit<SelectProps, "children" | "value" | "onChange">) {
  const defaultAuthenticationMode = useObservableEagerState(localSettings.defaultAuthenticationMode);

  return (
    <Select
      value={defaultAuthenticationMode}
      onChange={(e) => localSettings.defaultAuthenticationMode.next(e.target.value as RelayAuthMode)}
      {...props}
    >
      <option value="always">Always authenticate</option>
      <option value="ask">Ask every time</option>
      <option value="never">Never authenticate</option>
    </Select>
  );
}
