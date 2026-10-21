import { FormControl, FormHelperText, FormLabel, Select, Stack, Switch } from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";

import SimpleView from "../../../components/layout/presets/simple-view";
import useAsyncAction from "../../../hooks/use-async-action";
import localSettings from "../../../services/preferences";
import RelayTrust from "./components/relay-trust";

function VerifyEventSettings() {
  const method = use$(localSettings.verifyEventMethod);
  const optimistic = use$(localSettings.optimisticVerification);
  const { run: setMethod, loading: savingMethod } = useAsyncAction(async (value: string) =>
    localSettings.verifyEventMethod.next(value),
  );
  const { run: setOptimistic, loading: savingOptimistic } = useAsyncAction(async (value: boolean) =>
    localSettings.optimisticVerification.next(value),
  );

  return (
    <Stack spacing="6">
      <FormControl>
        <FormLabel htmlFor="verifyEventMethod">Signature verification method</FormLabel>
        <Select
          id="verifyEventMethod"
          value={method === "wasm-strict" ? "wasm" : method}
          onChange={(e) => setMethod(e.target.value)}
          isDisabled={savingMethod}
          maxW="sm"
        >
          <option value="wasm">WebAssembly (recommended)</option>
          <option value="internal">JavaScript</option>
          <option value="none">Skip public note signatures</option>
        </Select>
        <FormHelperText>WebAssembly speeds up signature checks, with JavaScript as a fallback.</FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel htmlFor="optimisticVerification">Optimistic verification</FormLabel>
        <Switch
          id="optimisticVerification"
          colorScheme="primary"
          isChecked={optimistic}
          onChange={(e) => setOptimistic(e.target.checked)}
          isDisabled={savingOptimistic}
        />
        <FormHelperText>
          Sample public note signatures as relays earn trust. Hashes and sensitive events stay fully checked.
        </FormHelperText>
      </FormControl>
      <RelayTrust />
    </Stack>
  );
}

export default function PerformanceSettings() {
  return (
    <SimpleView title="Performance">
      <VerifyEventSettings />
    </SimpleView>
  );
}
