import React, { useCallback, useContext, useState } from "react";
import { createDefer, Deferred } from "applesauce-core/promise";

import InvoiceModal from "../../components/invoice-modal";
import useAppSettings from "../../hooks/use-user-app-settings";

export type InvoiceModalContext = {
  requestPay: (invoice: string) => Promise<void>;
};

export const InvoiceModalContext = React.createContext<InvoiceModalContext>({
  requestPay: () => {
    throw new Error("not setup yet");
  },
});

export function useInvoiceModalContext() {
  return useContext(InvoiceModalContext);
}

export default function InvoiceModalProvider({ children }: { children: React.ReactNode }) {
  const [invoice, setInvoice] = useState<string>();
  const [defer, setDefer] = useState<Deferred<void>>();
  const { autoPayWithWebLN } = useAppSettings();

  const requestPay = useCallback(async (invoice: string) => {
    if (window.webln && autoPayWithWebLN) {
      try {
        if (!window.webln.enabled) await window.webln.enable();
        await window.webln.sendPayment(invoice);

        handlePaid();
        return;
      } catch (e) {}
    }

    const defer = createDefer<void>();
    setDefer(defer);
    setInvoice(invoice);
    return defer;
  }, []);

  const handleClose = useCallback(() => {
    if (defer) {
      setInvoice(undefined);
      setDefer(undefined);
      defer.reject();
    }
  }, [defer]);

  const handlePaid = useCallback(() => {
    if (defer) {
      setInvoice(undefined);
      setDefer(undefined);
      defer.resolve();
    }
  }, [defer]);

  return (
    <InvoiceModalContext.Provider value={{ requestPay }}>
      {children}
      {invoice && <InvoiceModal isOpen onClose={handleClose} invoice={invoice} onPaid={handlePaid} />}
    </InvoiceModalContext.Provider>
  );
}
