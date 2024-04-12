import { IconButton, IconButtonProps } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import { ChevronLeftIcon } from "../icons";

export default function BackButton({ ...props }: Omit<IconButtonProps, "onClick" | "children" | "aria-label">) {
  const navigate = useNavigate();
  return (
    <IconButton icon={<ChevronLeftIcon />} aria-label="Back" {...props} onClick={() => navigate(-1)}>
      Back
    </IconButton>
  );
}
