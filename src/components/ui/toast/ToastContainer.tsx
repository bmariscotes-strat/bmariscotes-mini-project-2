"use client";

import Toast from "@/components/ui/toast/Toast";
import { useToastContext } from "@/providers/ToastProvider";

export default function ToastContainer() {
  const { toasts, hideToast } = useToastContext();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onClose={hideToast} />
        </div>
      ))}
    </div>
  );
}
