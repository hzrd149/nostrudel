import { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardBody,
  Center,
  Flex,
  FlexProps,
  Heading,
  Input,
  SimpleGrid,
  Text,
  VisuallyHiddenInput,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useSet } from "react-use";

import { Kind0ParsedContent } from "../../helpers/user-metadata";
import { useRelayInfo } from "../../hooks/use-relay-info";
import { RelayFavicon } from "../../components/relay-favicon";
import ImagePlus from "../../components/icons/image-plus";

const containerProps: FlexProps = {
  w: "full",
  maxW: "sm",
  mx: "4",
  alignItems: "center",
  direction: "column",
};
const AppIcon = () => <Avatar src="/apple-touch-icon.png" size="lg" flexShrink={0} />;

function NameStep({ onSubmit }: { onSubmit: (metadata: Kind0ParsedContent) => void }) {
  const location = useLocation();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      name: "",
    },
    mode: "all",
  });
  const submit = handleSubmit((values) => {
    const displayName = values.name;
    const username = values.name.toLocaleLowerCase().replaceAll(/(\p{Z}|\p{P}|\p{C}|\p{M})/gu, "_");

    onSubmit({
      name: username,
      display_name: displayName,
    });
  });

  return (
    <Flex as="form" gap="2" onSubmit={submit} {...containerProps}>
      <AppIcon />
      <Heading size="lg" mb="2">
        Sign up
      </Heading>
      <Text>What should we call you?</Text>
      <Input placeholder="Jane" w="full" mb="2" {...register("name", { required: true })} autoComplete="off" />
      <Button w="full" colorScheme="primary" mb="4">
        Next
      </Button>
      <Text fontWeight="bold">Already have an account?</Text>
      <Button as={RouterLink} to="/signin" state={location.state}>
        Sign in
      </Button>
    </Flex>
  );
}

function ProfileImageStep({ displayName, onSubmit }: { displayName?: string; onSubmit: (picture?: File) => void }) {
  const [file, setFile] = useState<File>();
  const uploadRef = useRef<HTMLInputElement | null>(null);

  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <Flex gap="4" {...containerProps}>
      <Heading size="lg" mb="2">
        Add a profile image
      </Heading>
      <VisuallyHiddenInput
        type="file"
        accept="image/*"
        ref={uploadRef}
        onChange={(e) => setFile(e.target.files?.[0])}
      />
      <Avatar
        as="button"
        size="xl"
        src={preview}
        onClick={() => uploadRef.current?.click()}
        cursor="pointer"
        icon={<ImagePlus boxSize={8} />}
      />
      <Heading size="md">{displayName}</Heading>
      <Button w="full" colorScheme="primary" mb="4" maxW="sm" onClick={() => onSubmit(file)}>
        {file ? "Next" : "Skip for now"}
      </Button>
    </Flex>
  );
}

function RelayButton({ url, selected, onClick }: { url: string; selected: boolean; onClick: () => void }) {
  const { info } = useRelayInfo(url);

  return (
    <Card
      variant="outline"
      size="sm"
      borderColor={selected ? "primary.500" : "gray.500"}
      borderRadius="lg"
      cursor="pointer"
      onClick={onClick}
    >
      <CardBody>
        <Flex gap="2" mb="2">
          <RelayFavicon relay={url} />
          <Box>
            <Heading size="sm">{info?.name}</Heading>
            <Text fontSize="sm">{url}</Text>
          </Box>
        </Flex>
        <Text>{info?.description}</Text>
      </CardBody>
    </Card>
  );
}

const recommendedRelays = [
  "wss://relay.damus.io",
  "wss://welcome.nostr.wine",
  "wss://nos.lol",
  "wss://purplerelay.com",
  "wss://nostr.bitcoiner.social",
  "wss://nostr-pub.wellorder.net",
];
const defaultRelaySelection = new Set(["wss://relay.damus.io", "wss://nos.lol", "wss://welcome.nostr.wine"]);
function RelayStep({ onSubmit }: { onSubmit: (relays: string[]) => void }) {
  const [relays, relayActions] = useSet<string>(defaultRelaySelection);

  return (
    <Flex gap="4" {...containerProps} maxW="8in">
      <Heading size="lg" mb="2">
        Select some relays
      </Heading>

      <SimpleGrid columns={[1, 1, 2]} spacing="4">
        {recommendedRelays.map((url) => (
          <RelayButton key={url} url={url} selected={relays.has(url)} onClick={() => relayActions.toggle(url)} />
        ))}
      </SimpleGrid>

      {relays.size === 0 && <Text color="orange">You must select at least one relay</Text>}
      <Button
        w="full"
        colorScheme="primary"
        mb="4"
        maxW="sm"
        isDisabled={relays.size === 0}
        onClick={() => onSubmit(Array.from(relays))}
      >
        Next
      </Button>
    </Flex>
  );
}

export default function SignupView() {
  const [step, setStep] = useState(0);
  const [metadata, setMetadata] = useState<Kind0ParsedContent>({});
  const [profileImage, setProfileImage] = useState<File>();
  const [relays, setRelays] = useState<string[]>([]);

  const renderStep = () => {
    const next = () => setStep((v) => v + 1);
    switch (step) {
      case 0:
        return (
          <NameStep
            onSubmit={(m) => {
              setMetadata((v) => ({ ...v, ...m }));
              next();
            }}
          />
        );
      case 1:
        return (
          <ProfileImageStep
            displayName={metadata.display_name}
            onSubmit={(file) => {
              setProfileImage(file);
              next();
            }}
          />
        );
      case 2:
        return (
          <RelayStep
            onSubmit={(r) => {
              setRelays(r);
              next();
            }}
          />
        );
    }
  };

  return (
    <Center w="full" h="full">
      {renderStep()}
    </Center>
  );
}
