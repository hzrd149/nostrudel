// aislop-ignore-file ai-slop/console-leftover -- this module's purpose is console output
// Utility functions to interact with service worker error logs using RPC
import type { ServiceWorkerErrorLog } from "../worker/error-handler";
import { serviceWorkerRPC as client } from "./rpc";
import { firstValueFrom } from "rxjs";

// Get all error logs from the service worker
export const getServiceWorkerErrorLogs = async (): Promise<ServiceWorkerErrorLog[]> => {
  if (!client) throw new Error("Service worker not available");
  return await firstValueFrom(client.call("errors.getAll", void 0));
};

// Clear error logs from the service worker
export const clearServiceWorkerErrorLogs = async (): Promise<void> => {
  if (!client) throw new Error("Service worker not available");
  return await firstValueFrom(client.call("errors.clear", void 0));
};

// Get error logs by context from the service worker
export const getServiceWorkerErrorLogsByContext = async (context: string): Promise<ServiceWorkerErrorLog[]> => {
  if (!client) throw new Error("Service worker not available");
  return await firstValueFrom(client.call("errors.getByContext", { context }));
};

// Render a grouped console listing of error logs under a shared label
function renderErrorLogGroup(
  logs: ServiceWorkerErrorLog[],
  groupLabel: string,
  entryLabel: (log: ServiceWorkerErrorLog, index: number) => string,
): void {
  console.group(groupLabel);
  logs.forEach((log, index) => {
    console.group(entryLabel(log, index));
    console.log("Message:", log.message);
    if (log.stack) {
      console.log("Stack:", log.stack);
    }
    console.log("URL:", log.url);
    console.groupEnd();
  });
  console.groupEnd();
}

// Log error logs to console (for debugging)
export const logServiceWorkerErrors = async (): Promise<void> => {
  const logs = await getServiceWorkerErrorLogs();

  if (logs.length === 0) {
    console.log("No service worker errors found");
    return;
  }

  renderErrorLogGroup(
    logs,
    "Service Worker Error Logs:",
    (log, index) => `Error ${index + 1} - ${log.context} (${log.timestamp})`,
  );
};

// Log error logs by context to console (for debugging)
export const logServiceWorkerErrorsByContext = async (context: string): Promise<void> => {
  const logs = await getServiceWorkerErrorLogsByContext(context);

  if (logs.length === 0) {
    console.log(`No service worker errors found for context: ${context}`);
    return;
  }

  renderErrorLogGroup(
    logs,
    `Service Worker Error Logs (${context}):`,
    (log, index) => `Error ${index + 1} - ${log.timestamp}`,
  );
};

// Development helper: Log and clear errors
export const debugServiceWorkerErrors = async (): Promise<void> => {
  await logServiceWorkerErrors();
  await clearServiceWorkerErrorLogs();
  console.log("Error logs cleared");
};
