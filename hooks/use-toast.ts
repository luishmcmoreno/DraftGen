import { useState, useCallback } from 'react';

type ToastVariant = 'default' | 'destructive';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
}

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = Date.now().toString();
    const newToast: Toast = {
      id,
      ...options,
      variant: options.variant || 'default',
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);

    // For now, just console log the toast
    if (typeof window !== 'undefined') {
      console.log(`[Toast ${options.variant || 'default'}]:`, options.title, options.description);
    }
  }, []);

  return { toast, toasts };
}