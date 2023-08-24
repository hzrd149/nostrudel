import { Select, SelectProps } from "@chakra-ui/react";
import { usePeopleListContext } from "./people-list-provider";
import useUserLists from "../../hooks/use-user-lists";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { getListName } from "../../helpers/nostr/lists";
import { getEventCoordinate } from "../../helpers/nostr/events";
import { Kind } from "nostr-tools";

function UserListOptions() {
  const account = useCurrentAccount()!;
  const lists = useUserLists(account?.pubkey);

  return (
    <>
      {lists.map((list) => (
        <option key={getEventCoordinate(list)} value={getEventCoordinate(list)}>
          {getListName(list)}
        </option>
      ))}
    </>
  );
}

export default function PeopleListSelection({
  hideGlobalOption = false,
  ...props
}: {
  hideGlobalOption?: boolean;
} & Omit<SelectProps, "value" | "onChange" | "children">) {
  const account = useCurrentAccount()!;
  const { list, setList } = usePeopleListContext();

  return (
    <Select
      value={list}
      onChange={(e) => {
        setList(e.target.value === "global" ? undefined : e.target.value);
      }}
      {...props}
    >
      {account && <option value={`${Kind.Contacts}:${account.pubkey}`}>Following</option>}
      {!hideGlobalOption && <option value="global">Global</option>}
      {account && <UserListOptions />}
    </Select>
  );
}
