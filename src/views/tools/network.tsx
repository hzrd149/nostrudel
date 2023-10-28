import { Box, Button, Flex, Select, SimpleGrid, Text } from "@chakra-ui/react";
import { memo, useMemo, useState } from "react";

import { useCurrentAccount } from "../../hooks/use-current-account";
import RequireCurrentAccount from "../../providers/require-current-account";
import { useNetworkConnectionCount } from "../../hooks/use-user-network";
import UserAvatarLink from "../../components/user-avatar-link";
import { UserLink } from "../../components/user-link";
import { ChevronLeftIcon } from "../../components/icons";
import { useNavigate } from "react-router-dom";
import VerticalPageLayout from "../../components/vertical-page-layout";

const User = memo(({ pubkey, count }: { pubkey: string; count: number }) => (
  <Flex gap="2" overflow="hidden">
    <UserAvatarLink pubkey={pubkey} noProxy size="sm" />
    <UserLink pubkey={pubkey} isTruncated />
    <Text>({count})</Text>
  </Flex>
));

function NetworkPage() {
  const navigate = useNavigate();
  const account = useCurrentAccount()!;
  const [range, setRange] = useState("50-100");

  const network = useNetworkConnectionCount(account.pubkey);
  const filteredPubkeys = useMemo(() => {
    if (range.endsWith("+")) {
      const min = parseInt(range.replace("+", ""));
      return network.filter((p) => p.count > min);
    }
    const [min, max] = range.split("-").map((v) => parseInt(v));
    return network.filter((p) => p.count > min && p.count <= max);
  }, [range, network]);

  return (
    <VerticalPageLayout>
      <Flex gap="2">
        <Button leftIcon={<ChevronLeftIcon />} onClick={() => navigate(-1)}>
          Back
        </Button>
        <Select value={range} onChange={(e) => setRange(e.target.value)}>
          <option value="0-1">0-1 ({network.filter((p) => p.count <= 1).length})</option>
          <option value="1-10">1-10 ({network.filter((p) => p.count > 1 && p.count < 10).length})</option>
          <option value="10-20">10-20 ({network.filter((p) => p.count > 10 && p.count < 20).length})</option>
          <option value="20-50">20-50 ({network.filter((p) => p.count > 20 && p.count < 50).length})</option>
          <option value="50-100">50-100 ({network.filter((p) => p.count > 50 && p.count < 100).length})</option>
          <option value="100+">100+ ({network.filter((p) => p.count > 100).length})</option>
        </Select>
      </Flex>
      <SimpleGrid spacing="2" columns={5}>
        {filteredPubkeys.map(({ pubkey, count }) => (
          <User key={pubkey} pubkey={pubkey} count={count} />
        ))}
      </SimpleGrid>
    </VerticalPageLayout>
  );
}

export default function NetworkView() {
  return (
    <RequireCurrentAccount>
      <NetworkPage />
    </RequireCurrentAccount>
  );
}
