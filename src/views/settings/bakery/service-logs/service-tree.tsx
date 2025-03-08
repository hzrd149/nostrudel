import { Button, ButtonGroup, Flex, FlexProps, IconButton, useDisclosure } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import { ChevronDownIcon, ChevronRightIcon } from "../../../../components/icons";
import useBakeryControl from "../../../../hooks/use-bakery-control";

type Service = {
  id: string;
  name: string;
  parent?: Service;
  children: Service[];
};

function Branch({
  service,
  select,
  selected,
}: {
  service: Service;
  select: (service: string) => void;
  selected?: string;
}) {
  const expanded = useDisclosure({ defaultIsOpen: service.children.length <= 5 || !service.parent });

  return (
    <>
      <ButtonGroup isAttached variant="link" overflow="hidden">
        <Button
          onClick={() => select(service.id)}
          colorScheme={selected === service.id ? "green" : undefined}
          my="1"
          isTruncated
          justifyContent="flex-start"
        >
          {service.name}
        </Button>
        {service.children.length > 0 && (
          <IconButton
            my="1"
            icon={expanded.isOpen ? <ChevronDownIcon boxSize={6} /> : <ChevronRightIcon boxSize={6} />}
            aria-label="Expand"
            onClick={expanded.onToggle}
          />
        )}
      </ButtonGroup>

      {expanded.isOpen && (
        <Flex borderLeftWidth="2px" pl="2" direction="column">
          {service.children.map((child) => (
            <Branch key={child.id} service={child} select={select} selected={selected} />
          ))}
        </Flex>
      )}
    </>
  );
}

function getOrCreate(map: Map<string, Service>, path: string[]) {
  for (let i = 0; i < path.length; i++) {
    const id = path.slice(0, i + 1).join(":");
    const name = path[i];

    if (!map.has(id)) {
      const parent = map.get(path.slice(0, i).join(":"));
      let branch: Service = { id, name, children: [], parent };
      parent?.children.push(branch);
      map.set(id, branch);
    }
  }

  return map.get(path.join(":"));
}

export default function ServicesTree({
  select,
  selected,
  ...props
}: Omit<FlexProps, "children"> & { select: (service: string) => void; selected?: string }) {
  const control = useBakeryControl();
  const services = useObservable(control?.services) ?? [];

  const servicesById = new Map<string, Service>();
  for (const service of services) {
    getOrCreate(servicesById, service.split(":"));
  }

  const rootServices = Array.from(servicesById.values()).filter((service) => !service.parent);

  return (
    <Flex direction="column" overflow="auto" {...props}>
      {rootServices.map((service) => (
        <Branch key={service.id} service={service} select={select} selected={selected} />
      ))}
    </Flex>
  );
}
