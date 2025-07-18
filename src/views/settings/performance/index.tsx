import { FormControl, FormHelperText, FormLabel, Select } from "@chakra-ui/react";
import { useObservableEagerState } from "applesauce-react/hooks";

import SimpleView from "../../../components/layout/presets/simple-view";
import localSettings from "../../../services/preferences";

function VerifyEventSettings() {
  const verifyEventMethod = useObservableEagerState(localSettings.verifyEventMethod);

  return (
    <>
      <FormControl>
        <FormLabel htmlFor="verifyEventMethod" mb="0">
          Verify event method
        </FormLabel>
        <Select
          value={verifyEventMethod}
          onChange={(e) => localSettings.verifyEventMethod.next(e.target.value)}
          maxW="sm"
        >
          <option value="wasm">WebAssembly</option>
          <option value="internal">Internal</option>
          <option value="none">None</option>
        </Select>
        <FormHelperText>Default: All events signatures are checked</FormHelperText>
        <FormHelperText>WebAssembly: Events signatures are checked in a separate thread</FormHelperText>
        <FormHelperText>None: Only Profiles, Follows, and replaceable event signatures are checked</FormHelperText>
      </FormControl>
    </>
  );
}

export default function PerformanceSettings() {
  return (
    <SimpleView title="Performance">
      <VerifyEventSettings />
    </SimpleView>
  );
}
