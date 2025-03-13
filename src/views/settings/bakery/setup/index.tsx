import { Button, Flex, FormControl, FormHelperText, FormLabel, Heading, Input, useToast } from "@chakra-ui/react";
import { getPublicKey, nip19 } from "nostr-tools";
import { useForm } from "react-hook-form";
import { Navigate } from "react-router-dom";
import { isHexKey, parseNIP05Address } from "applesauce-core/helpers";
import { useObservable } from "applesauce-react/hooks";

import { bakery$, controlApi$, setBakeryURL } from "../../../../services/bakery";
import useRouteSearchValue from "../../../../hooks/use-route-search-value";
import dnsIdentityLoader from "../../../../services/dns-identity-loader";
import QRCodeScannerButton from "../../../../components/qr-code/qr-code-scanner-button";
import { IdentityStatus } from "applesauce-loaders/helpers/dns-identity";

export default function BakerySetupView() {
  const toast = useToast();
  const relayParam = useRouteSearchValue("relay");
  const authParam = useRouteSearchValue("auth");
  const bakery = useObservable(bakery$);
  const controlApi = useObservable(controlApi$);
  const config = useObservable(controlApi?.config);

  const { register, setValue, formState, handleSubmit } = useForm({
    defaultValues: { owner: "" },
    mode: "all",
  });

  const submit = handleSubmit(async (values) => {
    try {
      if (!bakery) throw new Error("Missing personal node connection");
      if (!controlApi) throw new Error("Missing control api connection");
      let pubkey: string = "";

      // hex
      if (isHexKey(values.owner)) pubkey = values.owner;

      // decode from NIP-19
      if (!pubkey && values.owner.startsWith("n")) {
        try {
          const decoded = nip19.decode(values.owner);
          switch (decoded.type) {
            case "npub":
              pubkey = decoded.data;
              break;
            case "nsec":
              pubkey = getPublicKey(decoded.data);
              break;
            case "nprofile":
              pubkey = decoded.data.pubkey;
              break;
          }
        } catch (error) {
          throw new Error("Failed to parse npub");
        }
      }

      if (!pubkey && values.owner.includes("@")) {
        try {
          const { name, domain } = parseNIP05Address(values.owner) || {};
          if (!name || !domain) throw new Error("Invalid address");
          const identity = await dnsIdentityLoader.fetchIdentity(name, domain);
          if (identity.status !== IdentityStatus.Found) throw new Error("Missing pubkey in NIP-05");
          pubkey = identity.pubkey;
        } catch (error) {
          throw new Error("Unable to find NIP-05 ID");
        }
      }

      if (!pubkey) throw new Error("Unable to find nostr public key");

      controlApi.setConfigField("owner", pubkey);
    } catch (error) {
      if (error instanceof Error) toast({ status: "error", description: error.message });
    }
  });

  if (config?.owner) {
    return <Navigate to="/" />;
  }

  if (relayParam.value) {
    if (bakery) {
      if (new URL(bakery.url).toString() !== new URL(relayParam.value).toString()) {
        setBakeryURL(relayParam.value);
      }
    } else setBakeryURL(relayParam.value);
  }

  return (
    <Flex w="full" h="full" alignItems="center" justifyContent="center">
      <Flex as="form" direction="column" gap="2" w="full" maxW="sm" m="4" onSubmit={submit}>
        <Heading>Setup Bakery</Heading>
        <FormControl isRequired>
          <FormLabel>Owner</FormLabel>
          <Flex gap="2">
            <Input {...register("owner", { required: true })} isRequired placeholder="john@example.com" />
            <QRCodeScannerButton onResult={(url) => setValue("owner", url)} />
          </Flex>
          <FormHelperText>Enter the NIP-05, npub, or hex pubkey of the owner of this node</FormHelperText>
        </FormControl>
        <Button type="submit" colorScheme="primary" isLoading={formState.isSubmitting} ml="auto">
          Setup
        </Button>
      </Flex>
    </Flex>
  );
}
