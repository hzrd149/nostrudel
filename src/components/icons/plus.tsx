import { createIcon } from "@chakra-ui/icons";

const Plus = createIcon({
  displayName: "Plus",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M12 5V19M5 12H19"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default Plus;
