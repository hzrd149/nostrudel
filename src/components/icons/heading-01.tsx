import { createIcon } from "@chakra-ui/icons";

const Heading01 = createIcon({
  displayName: "Heading01",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M6 4V20M18 4V20M8 4H4M18 12L6 12M8 20H4M20 20H16M20 4H16"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default Heading01;
