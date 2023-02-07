import { IconButton, IconButtonProps, useToast } from "@chakra-ui/react";
import { useUserMetadata } from "../hooks/use-user-metadata";
import { LightningIcon } from "./icons";
import { useState } from "react";
import { encodeText } from "../helpers/bech32";

export const UserTipButton = ({ pubkey, ...props }: { pubkey: string } & Omit<IconButtonProps, "aria-label">) => {
  const metadata = useUserMetadata(pubkey);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  if (!metadata) return null;

  let lnurl = metadata.lud06;
  if (metadata.lud16 && !lnurl) {
    const parts = metadata.lud16.split("@");
    lnurl = encodeText("lnurl", `https://${parts[1]}/.well-known/lnurlp/${parts[0]}`);
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
      } catch (e) {}
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
      color="yellow.300"
      {...props}
    />
  );
};
