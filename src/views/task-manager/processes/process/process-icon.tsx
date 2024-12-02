import { QuestionIcon } from "@chakra-ui/icons";
import { ComponentWithAs, IconProps } from "@chakra-ui/react";

import Process from "../../../../classes/process";

export default function ProcessIcon({ process, ...props }: { process: Process } & IconProps) {
  const IconComponent: ComponentWithAs<"svg", IconProps> = process.icon || QuestionIcon;

  return <IconComponent color={process.active ? "green.500" : "gray.500"} {...props} />;
}
