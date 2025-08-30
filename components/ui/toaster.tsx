'use client';

import { useEffect, useState } from 'react';
import { Toast, ToastProps } from './toast';

interface ToastWithTimer extends ToastProps {
  timer?: NodeJS.Timeout;
}

const toastQueue: ToastWithTimer[] = [];
const listeners: ((toasts: ToastWithTimer[]) => void)[] = [];

function notify() {
  listeners.forEach((listener) => listener([...toastQueue]));
}

export function toast(options: Omit<ToastProps, 'id' | 'onClose'>) {
  const id = Date.now().toString();

  const newToast: ToastWithTimer = {
    id,
    ...options,
  };

  // Set auto-dismiss timer
  const timer = setTimeout(() => {
    dismissToast(id);
  }, 5000);

  newToast.timer = timer;
  toastQueue.push(newToast);
  notify();
}

function dismissToast(id: string) {
  const index = toastQueue.findIndex((t) => t.id === id);
  if (index > -1) {
    const toast = toastQueue[index];
    if (toast.timer) {
      clearTimeout(toast.timer);
    }
    toastQueue.splice(index, 1);
    notify();
  }
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastWithTimer[]>([]);

  useEffect(() => {
    const listener = (newToasts: ToastWithTimer[]) => {
      setToasts(newToasts);
    };

    listeners.push(listener);

    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map((toastItem) => (
        <div key={toastItem.id} className="mb-2">
          <Toast {...toastItem} onClose={() => dismissToast(toastItem.id)} />
        </div>
      ))}
    </div>
  );
}
