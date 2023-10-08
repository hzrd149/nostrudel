import { createIcon } from "@chakra-ui/icons";

const BluetoothOn = createIcon({
  displayName: "BluetoothOn",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M6 7L18 17L12 22V2L18 7L6 17"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default BluetoothOn;
