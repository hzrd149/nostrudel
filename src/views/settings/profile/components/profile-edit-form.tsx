import {
  Button,
  ButtonGroup,
  Collapse,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Text,
  Textarea,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { parseNIP05Address, ProfileContent } from "applesauce-core/helpers";
import { IdentityStatus } from "applesauce-loaders/helpers/dns-identity";
import { useActiveAccount } from "applesauce-react/hooks";
import { useEffect, useRef, useState } from "react";
import { useForm, useFormContext } from "react-hook-form";

import { ChevronDownIcon, ChevronUpIcon, OutboxIcon } from "../../../../components/icons";
import { isLNURL } from "../../../../helpers/lnurl";
import dnsIdentityLoader from "../../../../services/dns-identity-loader";
import lnurlMetadataService from "../../../../services/lnurl-metadata";
import { ProfileFormData } from "..";

function isLightningAddress(addr: string) {
  const isEmail =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return isEmail.test(addr);
}

// Validation methods
const validateLightningAddress = async (value?: string) => {
  if (!value) return true;
  if (!isLNURL(value) && !isLightningAddress(value)) {
    return "Must be lightning address or LNURL";
  }

  try {
    const metadata = await lnurlMetadataService.requestMetadata(value);
    if (!metadata) {
      return "Incorrect or broken LNURL address";
    }

    // Check if the address supports nostr payments
    if (!metadata.allowsNostr) {
      return "Lightning address does not support Nostr zaps";
    }

    return true;
  } catch (error) {
    return "Error validating lightning address";
  }
};

const validateNip05 = async (address?: string, userPubkey?: string) => {
  if (!address) return true;
  if (!address.includes("@")) return "Invalid address";

  const { name, domain } = parseNIP05Address(address) || {};
  if (!name || !domain) return "Failed to parse address";

  try {
    const identity = await dnsIdentityLoader.fetchIdentity(name, domain);
    switch (identity.status) {
      case IdentityStatus.Error:
        return "Failed to connect to server";
      case IdentityStatus.Missing:
        return "Identity missing from server";
      case IdentityStatus.Found:
        if (identity.pubkey !== userPubkey) {
          return "Pubkey does not match your account";
        }
        return true;
    }
  } catch (error) {
    return "Error validating identity";
  }

  return true;
};

interface ProfileImageInputProps {
  label: string;
  placeholder: string;
  fieldName: "picture" | "banner";
  register: any;
  file?: File;
  onFileChange: (file?: File) => void;
}

function ProfileImageInput({ label, placeholder, fieldName, register, onFileChange }: ProfileImageInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    onFileChange(selectedFile);
  };

  const handlePaste = async (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        event.preventDefault();
        const pastedFile = item.getAsFile();
        if (!pastedFile) continue;

        onFileChange(pastedFile);
        break;
      }
    }
  };

  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <InputGroup>
        <Input onPaste={handlePaste} placeholder={placeholder} {...register(fieldName)} />
        <InputRightElement>
          <IconButton
            size="sm"
            icon={<OutboxIcon />}
            title={`Select ${fieldName}`}
            aria-label={`Select ${fieldName}`}
            onClick={() => inputRef.current?.click()}
          />
        </InputRightElement>
        <input type="file" accept="image/*" ref={inputRef} onChange={handleFileSelect} style={{ display: "none" }} />
      </InputGroup>
      <FormHelperText>
        Enter a URL or paste/upload an image file. You can also click the upload button to select a file from your
        device.
      </FormHelperText>
    </FormControl>
  );
}

export default function ProfileEditForm({
  onSubmit,
  loading,
  uploadStatus,
}: {
  onSubmit: (data: ProfileFormData) => void;
  loading?: boolean;
  uploadStatus?: string;
}) {
  const account = useActiveAccount()!;
  const { isOpen: showAdvanced, onToggle: toggleAdvanced } = useDisclosure();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useFormContext<ProfileFormData>();

  return (
    <VStack as="form" onSubmit={handleSubmit(onSubmit)} spacing={6} align="stretch">
      {/* Basic Information */}
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="semibold">
          Profile Information
        </Text>

        <FormControl isInvalid={!!errors.name} isRequired>
          <FormLabel>Name</FormLabel>
          <Input
            autoComplete="off"
            placeholder="Your name or nickname"
            {...register("name", {
              required: "Name is required",
            })}
          />
          <FormHelperText>
            A nickname for your profile. It does not need to be unique so call yourself whatever you want.
          </FormHelperText>
          <FormErrorMessage>{errors.name?.message}</FormErrorMessage>
        </FormControl>

        <FormControl>
          <FormLabel>About</FormLabel>
          <Textarea placeholder="Tell people about yourself..." resize="vertical" rows={4} {...register("about")} />
        </FormControl>
      </VStack>

      {/* Profile Images */}
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="semibold">
          Profile Images
        </Text>

        <ProfileImageInput
          label="Profile Picture"
          placeholder="https://example.com/picture.jpg or paste/upload image"
          fieldName="picture"
          register={register}
          onFileChange={(file) => setValue("picture", file)}
        />

        <ProfileImageInput
          label="Banner Image"
          placeholder="https://example.com/banner.jpg or paste/upload image"
          fieldName="banner"
          register={register}
          onFileChange={(file) => setValue("banner", file)}
        />
      </VStack>

      {/* Contact Information */}
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="semibold">
          Contact Information
        </Text>

        <FormControl isInvalid={!!errors.website}>
          <FormLabel>Website</FormLabel>
          <Input
            type="url"
            placeholder="https://example.com"
            autoComplete="off"
            {...register("website", { maxLength: 300 })}
          />
          <FormHelperText>Your personal website or blog.</FormHelperText>
        </FormControl>

        <FormControl isInvalid={!!errors.lud16}>
          <FormLabel>Lightning Address (or LNURL)</FormLabel>
          <Input
            placeholder="you@getalby.com or LNURL..."
            {...register("lud16", {
              validate: validateLightningAddress,
            })}
          />
          <FormHelperText>Your Lightning address for receiving zaps.</FormHelperText>
          <FormErrorMessage>{errors.lud16?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.nip05}>
          <FormLabel>NIP-05 ID</FormLabel>
          <Input
            type="email"
            placeholder="user@domain.com"
            autoComplete="off"
            {...register("nip05", {
              validate: (address) => validateNip05(address, account.pubkey),
            })}
          />
          <FormHelperText>
            Your{" "}
            <Link href="https://github.com/nostr-protocol/nips/blob/master/05.md" isExternal>
              NIP-05
            </Link>{" "}
            address. This is a verifiable identifier that proves you control a domain.
          </FormHelperText>
          <FormErrorMessage>{errors.nip05?.message}</FormErrorMessage>
        </FormControl>
      </VStack>

      {/* Advanced Section */}
      <VStack spacing={4} align="stretch">
        <Button
          variant="ghost"
          onClick={toggleAdvanced}
          rightIcon={showAdvanced ? <ChevronUpIcon /> : <ChevronDownIcon />}
          justifyContent="flex-start"
          fontWeight="semibold"
        >
          Advanced Options
        </Button>

        <Collapse in={showAdvanced}>
          <VStack spacing={4} align="stretch" pl={4}>
            <FormControl isInvalid={!!errors.display_name}>
              <FormLabel>Display Name</FormLabel>
              <Input
                placeholder="Your display name (optional)"
                {...register("display_name", {
                  maxLength: {
                    value: 64,
                    message: "Cannot exceed 64 characters",
                  },
                })}
              />
              <Text fontSize="sm" color="gray.600">
                If not set, your username will be used as your display name
              </Text>
              <FormErrorMessage>{errors.display_name?.message}</FormErrorMessage>
            </FormControl>
          </VStack>
        </Collapse>
      </VStack>

      {/* Actions */}
      <ButtonGroup>
        <Button onClick={() => reset()} isDisabled={loading}>
          Reset
        </Button>
        <Button colorScheme="primary" type="submit" isLoading={loading} loadingText={uploadStatus || "Saving..."}>
          Save Profile
        </Button>
      </ButtonGroup>
    </VStack>
  );
}
