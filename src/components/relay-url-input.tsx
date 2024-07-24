import { forwardRef } from "react";
import { Input, InputProps } from "@chakra-ui/react";
import { useAsync } from "react-use";

import { unique } from "../helpers/array";
import { fetchWithProxy } from "../helpers/request";

export type RelayUrlInputProps = Omit<InputProps, "type">;

export const RelayUrlInput = forwardRef(({ ...props }: Omit<InputProps, "type">, ref) => {
  const { value: relaysJson } = useAsync(async () =>
    fetchWithProxy("https://api.nostr.watch/v1/online").then((res) => res.json() as Promise<string[]>),
  );
  const relaySuggestions = unique(relaysJson ?? []);

  return (
    <>
      <Input ref={ref} list="relay-suggestions" type="url" {...props} />
      <datalist id="relay-suggestions">
        {relaySuggestions.map((url) => (
          <option key={url} value={url}>
            {url}
          </option>
        ))}
      </datalist>
    </>
  );
});
