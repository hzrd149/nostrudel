import { Alert, AlertIcon, AlertTitle } from "@chakra-ui/react";

import ContainedSimpleView from "../../components/layout/presets/contained-simple-view";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import PeopleListProvider from "../../providers/local/people-list-provider";

function GroupsExplorePage() {
  return (
    <ContainedSimpleView title="Explore channels" actions={<PeopleListSelection ms="auto" size="sm" />}>
      <Alert status="info">
        <AlertIcon />
        <AlertTitle>Work in progress</AlertTitle>
      </Alert>
    </ContainedSimpleView>
  );
}

export default function GroupsExploreView() {
  return (
    <PeopleListProvider>
      <GroupsExplorePage />
    </PeopleListProvider>
  );
}
