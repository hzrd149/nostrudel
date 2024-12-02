import { AbstractRelay } from "nostr-tools/abstract-relay";
import Process from "../classes/process";
import relayPoolService from "./relay-pool";

class ProcessManager {
  processes = new Set<Process>();

  registerProcess(process: Process) {
    this.processes.add(process);
  }
  unregisterProcess(process: Process) {
    this.processes.delete(process);
    for (const child of process.children) {
      this.unregisterProcess(child);
    }
  }

  getRootProcesses() {
    return Array.from(this.processes).filter((process) => !process.parent);
  }
  getProcessRoot(process: Process): Process {
    if (process.parent) return this.getProcessRoot(process.parent);
    else return process;
  }
  getRootProcessesForRelay(relayOrUrl: string | URL | AbstractRelay) {
    const relay = relayPoolService.getRelay(relayOrUrl);
    if (!relay) return new Set<Process>();

    const rootProcesses = new Set<Process>();
    for (const process of this.processes) {
      if (process.relays.has(relay)) {
        rootProcesses.add(this.getProcessRoot(process));
      }
    }

    return rootProcesses;
  }
}

const processManager = new ProcessManager();

if (import.meta.env.DEV) {
  // @ts-expect-error debug
  window.processManager = processManager;
}

export default processManager;
