import { toast as showToast } from '@/components/ui/toaster';

type ToastVariant = 'default' | 'destructive';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

export function useToast() {
  const toast = (options: ToastOptions) => {
    showToast(options);
  };

  return { toast };
}
