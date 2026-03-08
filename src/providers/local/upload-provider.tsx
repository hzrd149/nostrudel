import { createContext, PropsWithChildren, useCallback, useContext, useState } from "react";

export type UploadStatus = "queued" | "uploading" | "done" | "error";

export type UploadEntry = {
  id: string;
  file: File;
  status: UploadStatus;
  url?: string;
  error?: string;
};

type UploadContextType = {
  uploads: UploadEntry[];
  isUploading: boolean;
  addUpload: (file: File) => string;
  updateUpload: (id: string, patch: Partial<Omit<UploadEntry, "id" | "file">>) => void;
  removeUpload: (id: string) => void;
};

export const UploadContext = createContext<UploadContextType | null>(null);

let counter = 0;
function nextId() {
  return `upload-${++counter}-${Date.now()}`;
}

export default function UploadProvider({ children }: PropsWithChildren) {
  const [uploads, setUploads] = useState<UploadEntry[]>([]);

  const addUpload = useCallback((file: File): string => {
    const id = nextId();
    setUploads((prev) => [...prev, { id, file, status: "queued" }]);
    return id;
  }, []);

  const updateUpload = useCallback((id: string, patch: Partial<Omit<UploadEntry, "id" | "file">>) => {
    setUploads((prev) => prev.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }, []);

  const removeUpload = useCallback((id: string) => {
    setUploads((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const isUploading = uploads.some((u) => u.status === "queued" || u.status === "uploading");

  return (
    <UploadContext.Provider value={{ uploads, isUploading, addUpload, updateUpload, removeUpload }}>
      {children}
    </UploadContext.Provider>
  );
}

/** Returns the upload context, or null if used outside a provider (graceful degradation). */
export function useUploadContext(): UploadContextType | null {
  return useContext(UploadContext);
}
