import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Stack,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Textarea,
  Tfoot,
  Th,
  Thead,
  Tr,
} from "@chakra-ui/react";
import { SyntheticEvent, useState } from "react";
import useSubject from "../hooks/use-subject";
import settings from "../services/settings";

export const SettingsView = () => {
  const relays = useSubject(settings.relays);
  const [relayUrls, setRelayUrls] = useState(relays.join("\n"));

  const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const newRelays = relayUrls
      .split("\n")
      .filter(Boolean)
      .map((url) => url.trim());

    if (newRelays.length > 0) {
      settings.relays.next(newRelays);
    }
  };

  const resetForm = async () => {
    setRelayUrls(relays.join("\n"));
  };

  return (
    <>
      <TableContainer>
        <Table variant="simple">
          <TableCaption>Imperial to metric conversion factors</TableCaption>
          <Thead>
            <Tr>
              <Th>Url</Th>
              <Th>Read</Th>
              <Th>Write</Th>
              <Th></Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td>inches</Td>
              <Td>millimetres (mm)</Td>
              <Td isNumeric>25.4</Td>
            </Tr>
          </Tbody>
          <Tfoot>
            <Tr>
              <Th>To convert</Th>
              <Th>into</Th>
              <Th isNumeric>multiply by</Th>
            </Tr>
          </Tfoot>
        </Table>
      </TableContainer>
      <form onSubmit={handleSubmit}>
        <FormControl>
          <FormLabel>Relays</FormLabel>
          <Textarea
            value={relayUrls}
            onChange={(e) => setRelayUrls(e.target.value)}
            required
            size="md"
            rows={10}
            resize="vertical"
          />
          <FormHelperText>One relay per line</FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel>Email address</FormLabel>
          <Input type="text" />
          <FormHelperText>We'll never share your email.</FormHelperText>
        </FormControl>
        <Stack direction="row" spacing={4}>
          <Button onClick={resetForm}>Reset</Button>
          <Button type="submit" colorScheme="teal">
            Save
          </Button>
        </Stack>
      </form>
    </>
  );
};
