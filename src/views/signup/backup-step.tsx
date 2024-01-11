import {
  Alert,
  AlertIcon,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
} from "@chakra-ui/react";
import { nip19 } from "nostr-tools";

import { containerProps } from "./common";
import { CopyIconButton } from "../../components/copy-icon-button";
import styled from "@emotion/styled";
import { useState } from "react";
import { hexToBytes } from "@noble/hashes/utils";

const Blockquote = styled.figure`
  padding: var(--chakra-sizes-2) var(--chakra-sizes-4);
  border-radius: var(--chakra-radii-xl);
  background-color: var(--chakra-colors-chakra-subtle-bg);
  position: relative;

  &::before {
    content: "“";
    font-size: 10rem;
    line-height: 1em;
    top: var(--chakra-sizes-2);
    left: var(--chakra-sizes-2);
    position: absolute;
    opacity: 0.2;
  }
  &::after {
    content: "”";
    font-size: 10rem;
    line-height: 1em;
    bottom: calc(-0.75em + var(--chakra-sizes-2));
    right: var(--chakra-sizes-2);
    position: absolute;
    opacity: 0.2;
  }

  figcaption,
  blockquote {
    margin: var(--chakra-sizes-4);
  }
`;

export default function BackupStep({ secretKey, onConfirm }: { secretKey: string; onConfirm: () => void }) {
  const nsec = nip19.nsecEncode(hexToBytes(secretKey));

  const [confirmed, setConfirmed] = useState(false);
  const [last4, setLast4] = useState("");

  if (confirmed) {
    return (
      <Flex gap="4" {...containerProps}>
        <Heading>Confirm secret key</Heading>
        <FormControl mb="4">
          <FormLabel>Last four letters of secret key</FormLabel>
          <Input value={last4} onChange={(e) => setLast4(e.target.value)} placeholder="xxxx" autoFocus />
          <FormHelperText>This is the key to access your account, keep it secret.</FormHelperText>
        </FormControl>
        <Button w="full" maxW="sm" colorScheme="primary" onClick={onConfirm} isDisabled={last4 !== nsec.slice(-4)}>
          Confirm
        </Button>
        <Button
          variant="link"
          onClick={() => {
            setConfirmed(false);
            setLast4("");
          }}
        >
          Go back... I didn't save it
        </Button>
      </Flex>
    );
  }

  return (
    <Flex gap="4" {...containerProps} maxW="7in">
      <Heading>Backup your keys</Heading>

      <Blockquote>
        <blockquote>Keep It Secret, Keep it Safe.</blockquote>
        <figcaption>&mdash; Gandalf, The Fellowship of the Ring</figcaption>
      </Blockquote>

      <Alert status="info">
        <AlertIcon />
        Your secret key is like your password, if anyone gets a hold of it they will have complete control over your
        account
      </Alert>

      <FormControl mb="4">
        <FormLabel>Secret Key</FormLabel>
        <Flex gap="2">
          <Input value={nsec} />
          <CopyIconButton aria-label="Copy nsec" title="Copy nsec" text={nsec} />
        </Flex>
        <FormHelperText>This is the key to access your account, keep it secret.</FormHelperText>
      </FormControl>
      <Button w="full" maxW="sm" colorScheme="primary" onClick={() => setConfirmed(true)}>
        I have saved my secret key
      </Button>
    </Flex>
  );
}
