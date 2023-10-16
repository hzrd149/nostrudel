import { useState } from "react";
import { Center } from "@chakra-ui/react";
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
            displayName={metadata.display_name}
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
    <Center w="full" h="full">
      {renderStep()}
    </Center>
  );
}
