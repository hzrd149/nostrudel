/// <reference lib="webworker" />
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { rpcServer } from "./rpc";

declare let self: ServiceWorkerGlobalScope;

export interface ServiceWorkerErrorLog {
  timestamp: string;
  context: string;
  message: string;
  stack?: string;
  url: string;
}

// Database schema
interface ErrorLogDB extends DBSchema {
  errors: {
    key: string;
    value: ServiceWorkerErrorLog;
    indexes: {
      "by-timestamp": string;
      "by-context": string;
    };
  };
}

// Database instance
let db: IDBPDatabase<ErrorLogDB> | null = null;

// Initialize the database
const initDB = async (): Promise<IDBPDatabase<ErrorLogDB>> => {
  if (db) return db;

  db = await openDB<ErrorLogDB>("sw-error-logs", 1, {
    upgrade(db) {
      const store = db.createObjectStore("errors", {
        keyPath: "timestamp",
      });

      // Create indexes for better querying
      store.createIndex("by-timestamp", "timestamp");
      store.createIndex("by-context", "context");
    },
  });

  return db;
};

// Simple error logging system for service worker
const logError = async (error: any, context: string) => {
  const errorLog: ServiceWorkerErrorLog = {
    timestamp: new Date().toISOString(),
    context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    url: self.location.href,
  };

  console.error(`[SW Error - ${context}]:`, errorLog);

  // Save to IndexedDB using idb
  try {
    const database = await initDB();
    await database.add("errors", errorLog);
  } catch (e) {
    console.warn("Could not save error to IndexedDB:", e);
  }
};

// Get all error logs
export const getAllErrorLogs = async (): Promise<ServiceWorkerErrorLog[]> => {
  const database = await initDB();
  return await database.getAll("errors");
};

// Get error logs by context
export const getErrorLogsByContext = async (context: string): Promise<ServiceWorkerErrorLog[]> => {
  const database = await initDB();
  return await database.getAllFromIndex("errors", "by-context", context);
};

// Clear all error logs
export const clearAllErrorLogs = async (): Promise<void> => {
  const database = await initDB();
  await database.clear("errors");
};

// Set up global error handlers
export const setupErrorHandling = () => {
  self.addEventListener("error", (event) => {
    logError(event.error, "global-error");
  });

  self.addEventListener("unhandledrejection", (event) => {
    logError(event.reason, "unhandled-promise-rejection");
  });

  console.log("Service worker error handling initialized");
};

// Register RPC handlers for error log management

// Get all error logs
rpcServer.register("errors.getAll", getAllErrorLogs);

// Clear all error logs
rpcServer.register("errors.clear", clearAllErrorLogs);

// Get error logs by context
rpcServer.register("errors.getByContext", ({ context }: { context: string }) => {
  return getErrorLogsByContext(context);
});
