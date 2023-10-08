import { createIcon } from "@chakra-ui/icons";

const FilterLines = createIcon({
  displayName: "FilterLines",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M6 12H18M3 6H21M9 18H15"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default FilterLines;
