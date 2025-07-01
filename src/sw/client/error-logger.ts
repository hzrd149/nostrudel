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

// Log error logs to console (for debugging)
export const logServiceWorkerErrors = async (): Promise<void> => {
  const logs = await getServiceWorkerErrorLogs();

  if (logs.length === 0) {
    console.log("No service worker errors found");
    return;
  }

  console.group("Service Worker Error Logs:");
  logs.forEach((log, index) => {
    console.group(`Error ${index + 1} - ${log.context} (${log.timestamp})`);
    console.log("Message:", log.message);
    if (log.stack) {
      console.log("Stack:", log.stack);
    }
    console.log("URL:", log.url);
    console.groupEnd();
  });
  console.groupEnd();
};

// Log error logs by context to console (for debugging)
export const logServiceWorkerErrorsByContext = async (context: string): Promise<void> => {
  const logs = await getServiceWorkerErrorLogsByContext(context);

  if (logs.length === 0) {
    console.log(`No service worker errors found for context: ${context}`);
    return;
  }

  console.group(`Service Worker Error Logs (${context}):`);
  logs.forEach((log, index) => {
    console.group(`Error ${index + 1} - ${log.timestamp}`);
    console.log("Message:", log.message);
    if (log.stack) {
      console.log("Stack:", log.stack);
    }
    console.log("URL:", log.url);
    console.groupEnd();
  });
  console.groupEnd();
};

// Development helper: Log and clear errors
export const debugServiceWorkerErrors = async (): Promise<void> => {
  await logServiceWorkerErrors();
  await clearServiceWorkerErrorLogs();
  console.log("Error logs cleared");
};
