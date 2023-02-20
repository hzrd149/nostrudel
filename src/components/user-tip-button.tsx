import { IconButton, IconButtonProps, useToast } from "@chakra-ui/react";
import { useUserMetadata } from "../hooks/use-user-metadata";
import { LightningIcon } from "./icons";
import { useState } from "react";
import { encodeText } from "../helpers/bech32";

export const UserTipButton = ({
  pubkey,
  eventId,
  ...props
}: { pubkey: string; eventId?: string } & Omit<IconButtonProps, "aria-label">) => {
  const metadata = useUserMetadata(pubkey);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  if (!metadata) return null;

  // use lud06 and lud16 fields interchangeably
  let lnurl = metadata.lud06 || metadata.lud16;
  if (lnurl && lnurl.includes("@")) {
    //if its a lightning address convert it to a lnurl
    const parts = lnurl.split("@");
    if (parts[0] && parts[1]) {
      lnurl = encodeText("lnurl", `https://${parts[1]}/.well-known/lnurlp/${parts[0]}`);
    } else {
      // failed to parse it. something is wrong...
      lnurl = undefined;
    }
  }

  if (!lnurl) return null;

  const handleClick = async () => {
    if (!lnurl) return;
    setLoading(true);

    if (window.webln && window.webln.lnurl) {
      try {
        if (!window.webln.enabled) await window.webln.enable();
        await window.webln.lnurl(lnurl);

        toast({
          title: "Tip sent",
          status: "success",
          duration: 1000,
        });
      } catch (e: any) {
        toast({
          status: "error",
          description: e?.message,
          isClosable: true,
        });
      }
    } else {
      window.open(`lnurl:${lnurl}`);
    }
    setLoading(false);
  };

  return (
    <IconButton
      onClick={handleClick}
      aria-label="Send Tip"
      title="Send Tip"
      icon={<LightningIcon />}
      isLoading={loading}
      color="yellow.400"
      {...props}
    />
  );
};
