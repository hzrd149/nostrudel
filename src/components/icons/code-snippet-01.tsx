import { createIcon } from "@chakra-ui/icons";

const CodeSnippet01 = createIcon({
  displayName: "CodeSnippet01",
  viewBox: "0 0 24 24",
  path: [
    <path
      d="M16 18L22 12L16 6M8 6L2 12L8 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    ></path>,
  ],
  defaultProps: { boxSize: 4 },
});

export default CodeSnippet01;
