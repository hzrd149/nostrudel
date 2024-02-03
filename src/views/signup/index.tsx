import { useState } from "react";
import { Flex } from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";

import { Kind0ParsedContent } from "../../helpers/user-metadata";
import NameStep from "./name-step";
import ProfileImageStep from "./profile-image-step";
import RelayStep from "./relay-step";
import CreateStep from "./create-step";
import BackupStep from "./backup-step";
import FinishedStep from "./finished-step";

export default function SignupView() {
  const step = useParams().step || "name";
  const navigate = useNavigate();

  const [metadata, setMetadata] = useState<Kind0ParsedContent>({});
  const [profileImage, setProfileImage] = useState<File>();
  const [relays, setRelays] = useState<string[]>([]);
  const [secretKey, setSecretKey] = useState("");

  const renderStep = () => {
    switch (step) {
      case "name":
        return (
          <NameStep
            onSubmit={(m) => {
              setMetadata(m);
              navigate("/signup/profile");
            }}
          />
        );
      case "profile":
        return (
          <ProfileImageStep
            displayName={metadata.displayName}
            onSubmit={(file) => {
              setProfileImage(file);
              navigate("/signup/relays");
            }}
            onBack={() => navigate("/signup/name")}
          />
        );
      case "relays":
        return (
          <RelayStep
            onSubmit={(r) => {
              setRelays(r);
              navigate("/signup/create");
            }}
            onBack={() => navigate("/signup/profile")}
          />
        );
      case "create":
        return (
          <CreateStep
            metadata={metadata}
            relays={relays}
            profileImage={profileImage}
            onBack={() => navigate("/signup/relays")}
            onSubmit={(hex) => {
              setSecretKey(hex);
              navigate("/signup/backup");
            }}
          />
        );
      case "backup":
        return <BackupStep secretKey={secretKey} onConfirm={() => navigate("/signup/finished")} />;
      case "finished":
        return <FinishedStep />;
    }
  };

  return (
    <Flex direction="column" alignItems="center" gap="2" w="full" px="4" py="10">
      {renderStep()}
    </Flex>
  );
}
