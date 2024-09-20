import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Flex, IconButton, Input, InputProps } from "@chakra-ui/react";

import ClockStopwatch from "../../../../components/icons/clock-stopwatch";

export default function TimestampInput({
  timestamp,
  onChange,
  ...props
}: { timestamp?: number; onChange: (ts: number) => void } & Omit<InputProps, "type" | "value" | "onChange">) {
  const [value, setValue] = useState(() => (timestamp ? dayjs.unix(timestamp) : dayjs()).format("YYYY-MM-DDTHH:mm"));

  useEffect(() => {
    if (timestamp) {
      setValue(dayjs.unix(timestamp).format("YYYY-MM-DDTHH:mm"));
    }
  }, [timestamp]);

  const handleDateChange = (value: string) => {
    setValue(value);
    const date = dayjs(value, "YYYY-MM-DDTHH:mm");
    if (date.isValid()) {
      onChange(date.unix());
    }
  };

  return (
    <Flex gap="2" flex={1}>
      <Input type="datetime-local" value={value} onChange={(e) => handleDateChange(e.target.value)} {...props} />
      <IconButton
        icon={<ClockStopwatch boxSize={5} />}
        aria-label="Set to now"
        onClick={() => onChange(dayjs().unix())}
        size={props.size}
      />
    </Flex>
  );
}
