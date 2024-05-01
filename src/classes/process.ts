import { ComponentWithAs, IconProps } from "@chakra-ui/react";
import { SimpleRelay } from "nostr-idb";
import { AbstractRelay } from "nostr-tools";

let lastId = 0;
export default class Process {
  id = ++lastId;
  type: string;
  name?: string;
  icon?: ComponentWithAs<"svg", IconProps>;
  source: any;

  // if this process is running
  active: boolean = false;

  // the relays this process is claiming
  relays = new Set<AbstractRelay | SimpleRelay>();

  // the parent process
  parent?: Process;
  // any children this process has created
  children = new Set<Process>();

  constructor(type: string, source: any, relays?: Iterable<AbstractRelay | SimpleRelay>) {
    this.type = type;
    this.source = source;

    this.relays = new Set(relays);
  }

  static forkOrCreate(name: string, source: any, relays: Iterable<AbstractRelay | SimpleRelay>, parent?: Process) {
    return parent?.fork(name, source, relays) || new Process("BatchKindLoader", this, relays);
  }

  addChild(child: Process) {
    if (child === this) throw new Error("Process cant be a child of itself");
    this.children.add(child);
    child.parent = this;
  }

  fork(name: string, source: any, relays?: Iterable<AbstractRelay | SimpleRelay>) {
    const child = new Process(name, source, relays);
    this.addChild(child);
    return child;
  }

  remove() {
    if (!this.parent) return;

    this.parent.children.delete(this);
    this.parent = undefined;
  }
}
