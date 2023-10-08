import { createIcon } from "@chakra-ui/icons";

const Minus = createIcon({
  displayName: "Minus",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M5 12H19"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default Minus;
