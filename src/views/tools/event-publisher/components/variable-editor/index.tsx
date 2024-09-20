import { memo, ReactNode } from "react";
import {
  Flex,
  FlexProps,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  Text,
} from "@chakra-ui/react";
import { EventTemplate, NostrEvent } from "nostr-tools";

import { EnumVar, PubkeyVar, StringVar, TimestampVar, Variable } from "../../process";
import TimestampInput from "../datetime-input";
import PuzzlePiece01 from "../../../../../components/icons/puzzle-piece-01";
import UserAutocomplete from "../../../../../components/user-autocomplete";

function EnumVariableRow({
  variable,
  onChange,
}: {
  variable: EnumVar;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <Select value={variable.value} size="sm" rounded="md" onChange={(e) => onChange(variable.name, e.target.value)}>
      {variable.options?.map((opts) => (
        <option value={opts} key={opts}>
          {opts}
        </option>
      ))}
    </Select>
  );
}

function StringVariableRow({
  variable,
  onChange,
}: {
  variable: StringVar;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <Input
      type={variable.input || "text"}
      value={variable.value}
      placeholder={variable.placeholder}
      onChange={(e) => onChange(variable.name, e.target.value)}
      size="sm"
      rounded="md"
    />
  );
}

function PubkeyVariableRow({
  variable,
  onChange,
}: {
  variable: PubkeyVar;
  onChange: (name: string, value: string) => void;
}) {
  return (
    <UserAutocomplete
      value={variable.value}
      onChange={(e) => onChange(variable.name, e.target.value)}
      size="sm"
      rounded="md"
      hex
    />
  );
}

function TimestampVariableRow({
  variable,
  onChange,
}: {
  variable: TimestampVar;
  onChange: (name: string, value: string) => void;
}) {
  const ts = parseInt(variable.value);

  return (
    <TimestampInput
      timestamp={Number.isFinite(ts) ? ts : undefined}
      onChange={(ts) => onChange(variable.name, String(ts))}
      size="sm"
      rounded="md"
    />
  );
}

const VariableRow = memo(
  ({
    variable,
    onValueChange,
    onTypeChange,
  }: {
    variable: Variable;
    onValueChange: (name: string, value: string) => void;
    onTypeChange: (name: string, type: string) => void;
  }) => {
    let content: ReactNode = null;
    switch (variable.type) {
      case "enum":
        content = <EnumVariableRow variable={variable} onChange={onValueChange} />;
        break;
      case "string":
        content = <StringVariableRow variable={variable} onChange={onValueChange} />;
        break;
      case "pubkey":
        content = <PubkeyVariableRow variable={variable} onChange={onValueChange} />;
        break;
      case "timestamp":
        content = <TimestampVariableRow variable={variable} onChange={onValueChange} />;
        break;
    }

    return (
      <Flex gap="2" borderWidth="1px" rounded="md" p="2" alignItems="center">
        <Text fontWeight="bold" flexShrink={0} mr="2">
          {variable.name}
        </Text>
        {content}
        <Menu>
          <MenuButton as={IconButton} size="sm" aria-label="Options" icon={<PuzzlePiece01 />} variant="outline" />
          <MenuList>
            <MenuItem onClick={() => onTypeChange(variable.name, "string")}>String</MenuItem>
            <MenuItem onClick={() => onTypeChange(variable.name, "pubkey")}>Pubkey</MenuItem>
            <MenuItem onClick={() => onTypeChange(variable.name, "timestamp")}>Timestamp</MenuItem>
          </MenuList>
        </Menu>
      </Flex>
    );
  },
);

export default function VariableEditor({
  variables,
  onChange,
  ...props
}: {
  draft?: NostrEvent | EventTemplate;
  variables: Variable[];
  onChange: (variables: Variable[]) => void;
} & Omit<FlexProps, "children" | "onChange">) {
  const setVariableValue = (name: string, value: string) => {
    onChange(
      variables.map((v) => {
        if (v.name === name) return { ...v, value };
        return v;
      }),
    );
  };
  const setVariableType = (name: string, type: string) => {
    onChange(
      variables.map((v) => {
        if (v.name === name) return { ...v, type } as Variable;
        return v;
      }),
    );
  };

  return (
    <Flex direction="column" gap="2" {...props}>
      {variables.map((variable) => (
        <VariableRow
          key={variable.name}
          variable={variable}
          onValueChange={setVariableValue}
          onTypeChange={setVariableType}
        />
      ))}
    </Flex>
  );
}
