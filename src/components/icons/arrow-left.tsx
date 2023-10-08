import { createIcon } from "@chakra-ui/icons";

const ArrowLeft = createIcon({
  displayName: "ArrowLeft",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M19 12H5M5 12L12 19M5 12L12 5"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default ArrowLeft;
