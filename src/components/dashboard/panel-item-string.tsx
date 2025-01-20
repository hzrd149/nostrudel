import { PropsWithChildren, useState } from "react";
import { ButtonGroup, Code, Flex, FormControl, FormLabel, IconButton } from "@chakra-ui/react";

import QrCodeSvg from "../qr-code/qr-code-svg";
import { CopyIconButton } from "../copy-icon-button";
import { QrCodeIcon } from "../icons";

export default function PanelItemString({
  children,
  label,
  value,
  qr,
  isLoading,
}: PropsWithChildren<{
  label: string;
  value?: string;
  qr?: boolean;
  isLoading?: boolean;
}>) {
  const [showQR, setShowQR] = useState(false);

  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <Flex gap="2">
        {isLoading ? (
          "Loading..."
        ) : (
          <>
            <Code bg="none" userSelect="all" fontFamily="monospace" maxW="full" whiteSpace="pre" overflow="auto" p="1">
              {value}
            </Code>
            <ButtonGroup size="sm" variant="ghost">
              <CopyIconButton value={value} fontFamily="monospace" aria-label="Copy value" />
              {qr && (
                <IconButton
                  onClick={() => setShowQR((v) => !v)}
                  icon={<QrCodeIcon boxSize={5} />}
                  aria-label="show qrcode"
                />
              )}
            </ButtonGroup>
          </>
        )}
      </Flex>
      {value && showQR && <QrCodeSvg content={value} style={{ maxWidth: "3in", marginTop: "1em" }} />}
      {children}
    </FormControl>
  );
}
