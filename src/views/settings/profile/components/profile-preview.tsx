import { AspectRatio, Box, Card, CardBody, Center, Flex, Image, Text, VStack } from "@chakra-ui/react";
import { getDisplayName, ProfileContent } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { npubEncode } from "nostr-tools/nip19";
import { useFormContext, useWatch } from "react-hook-form";

import { ProfileFormData } from "..";
import UserAboutContent from "../../../../components/user/user-about-content";
import { MetadataAvatar } from "../../../../components/user/user-avatar";
import { truncateId } from "../../../../helpers/string";
import useObjectURL from "../../../../hooks/use-object-url";

export default function ProfilePreview() {
  const account = useActiveAccount()!;
  const { control } = useFormContext<ProfileFormData>();

  // Watch all form values
  const data = useWatch({ control });
  const metadata = data as ProfileContent;

  // Use object URLs for local files
  const pictureObjectUrl = useObjectURL(data.picture instanceof File ? data.picture : undefined);
  const bannerObjectUrl = useObjectURL(data.banner instanceof File ? data.banner : undefined);

  const picture = pictureObjectUrl || (data.picture as string);
  const banner = bannerObjectUrl || (data.banner as string);

  return (
    <Card>
      <CardBody p={0}>
        <VStack spacing={0} align="stretch">
          {/* Banner */}
          <AspectRatio ratio={3} bg="gray.100" borderTopRadius="md">
            {banner ? (
              <Image src={banner} objectFit="cover" />
            ) : (
              <Center>
                <Text color="gray.500">No banner</Text>
              </Center>
            )}
          </AspectRatio>

          {/* Profile info */}
          <Box p={4} pt={0}>
            <Flex align="end" mb={4}>
              <MetadataAvatar pubkey={account.pubkey} metadata={{ ...metadata, picture }} size="xl" mt={-8} noProxy />
              <VStack align="start" ml={4} spacing={1} flex={1}>
                <Text fontSize="xl" fontWeight="bold">
                  {getDisplayName(data as ProfileContent, truncateId(npubEncode(account.pubkey)))}
                </Text>
                {data.nip05 && (
                  <Text color="blue.500" fontSize="sm">
                    ✓ {data.nip05}
                  </Text>
                )}
              </VStack>
            </Flex>

            {data.about && <UserAboutContent mb={3} profile={metadata} />}

            <VStack align="start" spacing={1}>
              {data.website && (
                <Text color="blue.500" fontSize="sm">
                  🌐 {data.website}
                </Text>
              )}
              {data.lud16 && (
                <Text color="orange.500" fontSize="sm">
                  ⚡ {data.lud16}
                </Text>
              )}
            </VStack>
          </Box>
        </VStack>
      </CardBody>
    </Card>
  );
}
