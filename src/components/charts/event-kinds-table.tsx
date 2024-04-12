import { useMemo } from "react";
import { ButtonGroup, IconButton, Table, TableContainer, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import { TrashIcon } from "../icons";

export default function EventKindsTable({
  kinds,
  deleteKind,
}: {
  kinds: Record<string, number>;
  deleteKind?: (kind: string) => Promise<void>;
}) {
  const sorted = useMemo(
    () =>
      Object.entries(kinds)
        .map(([kind, count]) => ({ kind, count }))
        .sort((a, b) => b.count - a.count),
    [kinds],
  );

  return (
    <TableContainer>
      <Table size="sm">
        <Thead>
          <Tr>
            <Th isNumeric>Kind</Th>
            <Th isNumeric>Count</Th>
            {deleteKind && <Th></Th>}
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
                      icon={<TrashIcon />}
                      aria-label="Delete kind"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => deleteKind(kind)}
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
