import { Input, InputProps } from "@chakra-ui/react";
import { useAsync } from "react-use";
import { unique } from "../helpers/array";

export type RelayUrlInputProps = Omit<InputProps, "type">;

export const RelayUrlInput = ({ ...props }: RelayUrlInputProps) => {
  const { value: relaysJson, loading: loadingRelaysJson } = useAsync(async () =>
    fetch("/relays.json").then((res) => res.json() as Promise<{ relays: string[] }>)
  );
  const relaySuggestions = relaysJson?.relays ? unique(relaysJson?.relays) : [];

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
