import { Select, SelectProps } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import localSettings from "../../services/local-settings";
import { RelayAuthMode } from "../../classes/relay-pool";

export default function DefaultAuthModeSelect({ ...props }: Omit<SelectProps, "children" | "value" | "onChange">) {
  const defaultAuthenticationMode = useObservable(localSettings.defaultAuthenticationMode);

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
