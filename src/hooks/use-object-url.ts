import { useEffect, useState } from "react";

export default function useObjectURL(object?: File | Blob | null) {
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    if (object) {
      const u = URL.createObjectURL(object);
      setUrl(u);
      return () => URL.revokeObjectURL(u);
    } else setUrl(undefined);
  }, [object]);

  return url;
}
