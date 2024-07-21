import { useMemo, useState } from "react";
import { ButtonGroup, IconButton, Table, TableContainer, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import { TrashIcon } from "../icons";

export default function EventKindsTable({
  kinds,
  deleteKind,
}: {
  kinds: Record<string, number>;
  deleteKind?: (kind: string) => Promise<void>;
}) {
  const [deleting, setDeleting] = useState<string>();
  const sorted = useMemo(
    () =>
      Object.entries(kinds)
        .map(([kind, count]) => ({ kind, count }))
        .sort((a, b) => b.count - a.count),
    [kinds],
  );

  return (
    <TableContainer minH="sm">
      <Table size="sm">
        <Thead>
          <Tr>
            <Th isNumeric>Kind</Th>
            <Th isNumeric>Count</Th>
            {deleteKind && <Th w="4"></Th>}
          </Tr>
        </Thead>
        <Tbody>
          {sorted.map(({ kind, count }) => (
            <Tr key={kind}>
              <Td isNumeric>{kind}</Td>
              <Td isNumeric>{count}</Td>
              {deleteKind && (
                <Td isNumeric>
                  <ButtonGroup size="xs">
                    <IconButton
                      isLoading={deleting === kind}
                      icon={<TrashIcon />}
                      aria-label="Delete kind"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => {
                        setDeleting(kind);
                        deleteKind(kind).finally(() => setDeleting(undefined));
                      }}
                    />
                  </ButtonGroup>
                </Td>
              )}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
