"use client";

import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Toast as ToastType } from "@/hooks/useToast";

interface ToastProps {
  toast: ToastType;
  onClose: (id: string) => void;
}

const toastStyles = {
  success: {
    container: "bg-green-50 border-green-200 text-green-800",
    icon: "text-green-500",
  },
  error: {
    container: "bg-red-50 border-red-200 text-red-800",
    icon: "text-red-500",
  },
  warning: {
    container: "bg-yellow-50 border-yellow-200 text-yellow-800",
    icon: "text-yellow-500",
  },
  info: {
    container: "bg-blue-50 border-blue-200 text-blue-800",
    icon: "text-blue-500",
  },
};

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export default function Toast({ toast, onClose }: ToastProps) {
  const IconComponent = toastIcons[toast.type];
  const styles = toastStyles[toast.type];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transform transition-all duration-300 ease-in-out ${styles.container}`}
    >
      <IconComponent size={20} className={styles.icon} />
      <span className="font-medium flex-1">{toast.message}</span>
      <button
        onClick={() => onClose(toast.id)}
        className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
