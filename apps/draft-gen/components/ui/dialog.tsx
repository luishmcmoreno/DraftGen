'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

const useDialogContext = () => {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog');
  }
  return context;
};

interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const Dialog = ({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
}: DialogProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);

  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (controlledOpen === undefined) {
        setUncontrolledOpen(newOpen);
      }
      onOpenChange?.(newOpen);
    },
    [controlledOpen, onOpenChange]
  );

  const contextValue = React.useMemo(() => ({ open, onOpenChange: setOpen }), [open, setOpen]);

  return <DialogContext.Provider value={contextValue}>{children}</DialogContext.Provider>;
};

interface DialogTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ children, asChild = false, className, ...props }, ref) => {
    const { onOpenChange } = useDialogContext();

    const handleClick = () => {
      onOpenChange(true);
    };

    if (asChild) {
      return React.cloneElement(
        children as React.ReactElement,
        {
          ...props,
          onClick: (e: React.MouseEvent) => {
            handleClick();
            const childProps = (
              children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
            ).props;
            childProps.onClick?.(e);
          },
          ref,
        } as any
      );
    }

    return (
      <button ref={ref} className={className} onClick={handleClick} {...props}>
        {children}
      </button>
    );
  }
);
DialogTrigger.displayName = 'DialogTrigger';

interface DialogPortalProps {
  children: React.ReactNode;
  container?: HTMLElement;
}

const DialogPortal = ({ children, container }: DialogPortalProps) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const root = container || (typeof document !== 'undefined' ? document.body : null);

  if (!root) {
    return null;
  }

  return createPortal(children, root);
};

const DialogOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { onOpenChange } = useDialogContext();

    return (
      <div
        ref={ref}
        className={cn(
          'fixed inset-0 z-50 bg-black/80 animate-in fade-in-0 duration-300',
          className
        )}
        onClick={() => onOpenChange(false)}
        {...props}
      />
    );
  }
);
DialogOverlay.displayName = 'DialogOverlay';

const DialogClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ children, asChild = false, ...props }, ref) => {
  const { onOpenChange } = useDialogContext();

  const handleClick = () => {
    onOpenChange(false);
  };

  if (asChild) {
    return React.cloneElement(
      children as React.ReactElement,
      {
        ...props,
        onClick: (e: React.MouseEvent) => {
          handleClick();
          const childProps = (
            children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
          ).props;
          childProps.onClick?.(e);
        },
        ref,
      } as any
    );
  }

  return (
    <button ref={ref} onClick={handleClick} {...props}>
      {children}
    </button>
  );
});
DialogClose.displayName = 'DialogClose';

const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const { open, onOpenChange } = useDialogContext();

    React.useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          onOpenChange(false);
        }
      };

      if (open) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';
      }

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }, [open, onOpenChange]);

    if (!open) {
      return null;
    }

    return (
      <DialogPortal>
        <DialogOverlay />
        <div
          ref={ref}
          className={cn(
            'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%] sm:rounded-lg',
            className
          )}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {children}
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </div>
      </DialogPortal>
    );
  }
);
DialogContent.displayName = 'DialogContent';

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
DialogDescription.displayName = 'DialogDescription';

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
