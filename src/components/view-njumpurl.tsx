import { NjumpIcon } from "./icons";
import { IconButton, IconButtonProps, ComponentWithAs, LinkProps } from "@chakra-ui/react";
export const ViewNjumpUrl= ({ value, ...props }: { value?: string; as?: ComponentWithAs<"a", LinkProps>; href?: string; "aria-label"?: string; title?: string; size?: string; } & Omit<IconButtonProps, "icon">) => { 
  return (
    <IconButton
      icon={<NjumpIcon/>}
      onClick={() => {
        
      }}
      {...props}
    />
  );
};
