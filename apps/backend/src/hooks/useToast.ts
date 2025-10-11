import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  var iant: 'default' | 'success' | 'error' | 'warning' | 'info' | 'destructive';
  duration?: number;
}

interface ToastOptions {
  title: string;
  description?: string;
  var iant?: Toast['var iant'];
  duration?: number;
}

let toastCount = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((options: ToastOptions) => {
    const id = (++toastCount).toString();
    const newToast: Toast = {
      id,
      title: options.title,
      description: options.description,
      var iant: options.var iant || 'default',
      duration: options.duration || 5000
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after duration
    const duration = newToast.duration || 5000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  // Create toast object with helper methods
  const toast = Object.assign(
    (options: ToastOptions | string) => {
      if (typeof options === 'string') {
        return showToast({ title: options });
      }
      return showToast(options);
    },
    {
      success: (title: string, description?: string) => 
        showToast({ title, description, var iant: 'success' as const }),
      error: (title: string, description?: string) => 
        showToast({ title, description, var iant: 'error' as const }),
      warning: (title: string, description?: string) => 
        showToast({ title, description, var iant: 'warning' as const }),
      info: (title: string, description?: string) => 
        showToast({ title, description, var iant: 'info' as const })
    }
  );

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toast,
    toasts,
    dismiss,
    dismissAll,
    error: undefined // Legacy compatibility
  };
};
