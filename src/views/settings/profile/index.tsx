import { Grid, GridItem, Text, VStack } from "@chakra-ui/react";
import { CreateProfile, UpdateProfile } from "applesauce-actions/actions";
import { ProfileContent } from "applesauce-core/helpers";
import { useActionHub, useActiveAccount, useObservableMemo } from "applesauce-react/hooks";
import { nip19 } from "nostr-tools";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import SimpleView from "../../../components/layout/presets/simple-view";
import { isLNURL } from "../../../helpers/lnurl";
import useAsyncAction from "../../../hooks/use-async-action";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useUploadFile from "../../../hooks/use-upload-file";
import useUserProfile from "../../../hooks/use-user-profile";
import { usePublishEvent } from "../../../providers/global/publish-provider";
import { profileLoader } from "../../../services/loaders";
import localSettings from "../../../services/preferences";
import ProfileEditForm from "./components/profile-edit-form";
import ProfilePreview from "./components/profile-preview";
import { eventStore } from "../../../services/event-store";

export type ProfileFormData = Omit<ProfileContent, "picture" | "banner"> & {
  picture?: string | File;
  banner?: string | File;
};

function isLightningAddress(addr: string) {
  const isEmail =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return isEmail.test(addr);
}

export default function ProfileSettingsView() {
  const publish = usePublishEvent();
  const account = useActiveAccount()!;
  const metadata = useUserProfile(account.pubkey);
  const readRelays = useReadRelays();
  const uploadFile = useUploadFile();
  const navigate = useNavigate();
  const [uploadStatus, setUploadStatus] = useState<string>();
  const actions = useActionHub();

  // Form management
  const formMethods = useForm<ProfileFormData>({
    mode: "onBlur",
    defaultValues: metadata,
  });

  // Load a fresh profile metadata to avoid stale data
  useObservableMemo(
    () => profileLoader({ pubkey: account.pubkey, kind: 0, cache: false, relays: readRelays }),
    [account.pubkey, readRelays],
  );

  // Reset form when metadata changes
  useEffect(() => {
    if (metadata) {
      formMethods.reset(metadata);
    }
  }, [metadata, formMethods]);

  const { run: handleSubmit, loading } = useAsyncAction(
    async (update: ProfileFormData) => {
      try {
        const newMetadata: ProfileContent = {
          name: update.name,
          about: update.about,
          website: update.website,
        };

        // Upload files if selected
        if (update.picture) {
          if (typeof update.picture === "string") {
            newMetadata.picture = update.picture;
          } else {
            setUploadStatus("Uploading profile picture...");
            const uploadResult = await uploadFile.run(update.picture);
            if (uploadResult) newMetadata.picture = uploadResult.url;
          }
        }

        if (update.banner) {
          if (typeof update.banner === "string") {
            newMetadata.banner = update.banner;
          } else {
            setUploadStatus("Uploading banner image...");
            const uploadResult = await uploadFile.run(update.banner);
            if (uploadResult) newMetadata.banner = uploadResult.url;
          }
        }

        setUploadStatus("Creating profile event...");

        if (update.display_name !== undefined) newMetadata.displayName = newMetadata.display_name = update.display_name;
        if (update.about !== undefined) newMetadata.about = update.about;
        if (update.website !== undefined) newMetadata.website = update.website;
        if (update.nip05 !== undefined) newMetadata.nip05 = update.nip05;

        if (update.lud16) {
          if (isLNURL(update.lud16)) {
            newMetadata.lud06 = update.lud16;
            delete newMetadata.lud16;
          } else if (isLightningAddress(update.lud16)) {
            newMetadata.lud16 = update.lud16;
            delete newMetadata.lud06;
          }
        }

        setUploadStatus("Signing and publishing...");
        if (eventStore.hasReplaceable(0, account.pubkey)) {
          await actions
            .exec(UpdateProfile, newMetadata)
            .forEach((e) => publish("Update profile", e, localSettings.lookupRelays.value));
        } else {
          await actions
            .exec(CreateProfile, newMetadata)
            .forEach((e) => publish("Create profile", e, localSettings.lookupRelays.value));
        }

        // Navigate to user profile
        const npub = nip19.npubEncode(account.pubkey);
        navigate(`/u/${npub}`);
      } finally {
        setUploadStatus(undefined);
      }
    },
    [uploadFile, actions, publish, navigate, account.pubkey],
  );

  return (
    <SimpleView title="Edit Profile" maxW="6xl" center>
      <FormProvider {...formMethods}>
        <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={8}>
          {/* Form */}
          <GridItem>
            <ProfileEditForm onSubmit={handleSubmit} loading={loading} uploadStatus={uploadStatus} />
          </GridItem>

          {/* Preview */}
          <GridItem>
            <VStack spacing={4} align="stretch" position="sticky" top={4}>
              <Text fontSize="lg" fontWeight="semibold">
                Preview
              </Text>
              <ProfilePreview />
            </VStack>
          </GridItem>
        </Grid>
      </FormProvider>
    </SimpleView>
  );
}
