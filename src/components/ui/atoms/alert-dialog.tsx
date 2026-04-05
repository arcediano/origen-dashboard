/**
 * @file alert-dialog.tsx
 * @description Diálogo de alerta premium - 100% responsive
 */

'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/atoms/button';
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';

interface AlertDialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AlertDialogContext = React.createContext<AlertDialogContextType | undefined>(undefined);

const useAlertDialog = () => {
  const context = React.useContext(AlertDialogContext);
  if (!context) {
    throw new Error('useAlertDialog debe usarse dentro de un AlertDialog');
  }
  return context;
};

interface AlertDialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const AlertDialog = ({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  children,
}: AlertDialogProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </AlertDialogContext.Provider>
  );
};

AlertDialog.displayName = 'AlertDialog';

interface AlertDialogTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

const AlertDialogTrigger = ({ children, onClick, asChild }: AlertDialogTriggerProps) => {
  const { onOpenChange } = useAlertDialog();

  const handleClick = (e: React.MouseEvent) => {
    onClick?.(e);
    onOpenChange(true);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
    } as any);
  }

  return (
    <div onClick={handleClick} style={{ display: 'inline-block', cursor: 'pointer' }}>
      {children}
    </div>
  );
};

AlertDialogTrigger.displayName = 'AlertDialogTrigger';

interface AlertDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  showClose?: boolean;
  variant?: 'default' | 'warning' | 'success' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

const AlertDialogContent = React.forwardRef<HTMLDivElement, AlertDialogContentProps>(
  ({ className, children, showClose = true, variant = 'default', size = 'md', ...props }, ref) => {
    const { open, onOpenChange } = useAlertDialog();
    const [mounted, setMounted] = React.useState(false);
    const overlayRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      setMounted(true);
      return () => setMounted(false);
    }, []);

    React.useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && open) {
          onOpenChange(false);
        }
      };

      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }, [open, onOpenChange]);

    React.useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }

      return () => {
        document.body.style.overflow = '';
      };
    }, [open]);

    const handleOverlayClick = (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) {
        onOpenChange(false);
      }
    };

    const variantIcons = {
      default: null,
      warning: <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />,
      success: <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />,
      info: <Info className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />,
    };

    const sizeClasses = {
      sm: "max-w-sm p-4 sm:p-5",
      md: "max-w-md p-5 sm:p-6",
      lg: "max-w-lg p-6 sm:p-8",
    };

    if (!mounted || !open) return null;

    return createPortal(
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[70] bg-origen-oscuro/60 flex items-center justify-center p-4 animate-in fade-in-0"
        onClick={handleOverlayClick}
      >
        <div
          ref={ref}
          className={cn(
            "relative w-full bg-surface-alt rounded-2xl shadow-2xl border border-border",
            "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2",
            sizeClasses[size],
            className
          )}
          {...props}
        >
          {showClose && (
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-3 top-3 sm:right-4 sm:top-4 h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-surface transition-all"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
          
          {variantIcons[variant] && (
            <div className="absolute left-4 sm:left-6 top-4 sm:top-6">
              {variantIcons[variant]}
            </div>
          )}
          
          {children}
        </div>
      </div>,
      document.body
    );
  }
);

AlertDialogContent.displayName = 'AlertDialogContent';

const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);

AlertDialogHeader.displayName = 'AlertDialogHeader';

const AlertDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4 sm:mt-6",
      className
    )}
    {...props}
  />
);

AlertDialogFooter.displayName = 'AlertDialogFooter';

const AlertDialogTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h2
    className={cn(
      "text-base sm:text-lg font-semibold text-origen-bosque",
      className
    )}
    {...props}
  />
);

AlertDialogTitle.displayName = 'AlertDialogTitle';

const AlertDialogDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p
    className={cn(
      "text-xs sm:text-sm text-text-subtle",
      className
    )}
    {...props}
  />
);

AlertDialogDescription.displayName = 'AlertDialogDescription';

interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  asChild?: boolean;
  variant?: 'default' | 'destructive' | 'success';
}

const AlertDialogAction = ({ 
  className, 
  children, 
  onClick, 
  asChild, 
  variant = 'default',
  ...props 
}: AlertDialogActionProps) => {
  const { onOpenChange } = useAlertDialog();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    onOpenChange(false);
  };

  const variantClasses = {
    default: 'bg-origen-bosque hover:bg-hover-bosque text-white',
    destructive: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
    } as any);
  }

  return (
    <Button
      className={cn(variantClasses[variant], className)}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
};

AlertDialogAction.displayName = 'AlertDialogAction';

interface AlertDialogCancelProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  asChild?: boolean;
}

const AlertDialogCancel = ({ className, children, onClick, asChild, ...props }: AlertDialogCancelProps) => {
  const { onOpenChange } = useAlertDialog();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    onOpenChange(false);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: handleClick,
    } as any);
  }

  return (
    <Button
      variant="outline"
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
};

AlertDialogCancel.displayName = 'AlertDialogCancel';

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};