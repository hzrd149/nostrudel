import { Alert, AlertIcon, AlertTitle } from "@chakra-ui/react";
import { Navigate, useParams } from "react-router-dom";
import ContainedSimpleView from "../../components/layout/presets/contained-simple-view";

export default function GroupView() {
  const { identifier } = useParams();
  if (!identifier) return <Navigate to="/groups" />;

  // const pointer = decodeGroupPointer(identifier);

  return (
    <ContainedSimpleView title="Group">
      <Alert status="info">
        <AlertIcon />
        <AlertTitle>Work in progress</AlertTitle>
      </Alert>
    </ContainedSimpleView>
  );
}
