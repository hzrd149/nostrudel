import { forwardRef } from "react";
import { Input, InputProps } from "@chakra-ui/react";
import { useAsync } from "react-use";

import { unique } from "../helpers/array";

export type RelayUrlInputProps = Omit<InputProps, "type">;

export const RelayUrlInput = forwardRef(({ nips, ...props }: { nips?: number[] } & Omit<InputProps, "type">, ref) => {
  const { value: relaysJson } = useAsync(async () => {
    let online = await fetch("https://api.nostr.watch/v1/online").then((res) => res.json() as Promise<string[]>);
    if (!nips) return online;

    for (const nip of nips) {
      if (online.length === 0) break;
      const supported = await fetch("https://api.nostr.watch/v1/nip/" + nip).then(
        (res) => res.json() as Promise<string[]>,
      );
      online = online.filter((url) => supported.includes(url));
    }
    return online;
  }, [nips?.join("|")]);

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
