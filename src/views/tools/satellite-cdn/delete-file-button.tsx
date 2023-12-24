import { useCallback, useState } from "react";
import { IconButton, useToast } from "@chakra-ui/react";

import { SatelliteCDNFile, deleteFile } from "../../../helpers/satellite-cdn";
import { useSigningContext } from "../../../providers/signing-provider";
import { TrashIcon } from "../../../components/icons";

export default function FileDeleteButton({ file }: { file: SatelliteCDNFile }) {
  const toast = useToast();
  const { requestSignature } = useSigningContext();

  const [loading, setLoading] = useState(false);
  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      await deleteFile(file.sha256, requestSignature);
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
    setLoading(false);
  }, [requestSignature, file]);

  return (
    <IconButton
      icon={<TrashIcon />}
      aria-label="Delete File"
      title="Delete File"
      colorScheme="red"
      onClick={handleClick}
      isLoading={loading}
    />
  );
}
