import { Input, InputProps } from "@chakra-ui/react";
import { useAsync } from "react-use";
import { unique } from "../helpers/array";

export type RelayUrlInputProps = Omit<InputProps, "type">;

export const RelayUrlInput = ({ ...props }: RelayUrlInputProps) => {
  const { value: relaysJson, loading: loadingRelaysJson } = useAsync(async () =>
    fetch("https://api.nostr.watch/v1/online").then((res) => res.json() as Promise<string[]>)
  );
  const relaySuggestions = unique(relaysJson ?? []);

  return (
    <>
      <Input list="relay-suggestions" type="url" isDisabled={props.isDisabled ?? loadingRelaysJson} {...props} />
      <datalist id="relay-suggestions">
        {relaySuggestions.map((url) => (
          <option key={url} value={url}>
            {url}
          </option>
        ))}
      </datalist>
    </>
  );
};
