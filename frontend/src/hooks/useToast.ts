import toast, { Toast } from 'react-hot-toast';

interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

export const useToast = () => {
  const showToast = (message: string, type: 'success' | 'error' | 'loading' | 'custom' = 'custom', options?: ToastOptions) => {
    const defaultOptions: ToastOptions = {
      duration: type === 'loading' ? Infinity : 4000,
      position: 'top-right',
      ...options,
    };

    switch (type) {
      case 'success':
        return toast.success(message, defaultOptions);
      case 'error':
        return toast.error(message, defaultOptions);
      case 'loading':
        return toast.loading(message, defaultOptions);
      default:
        return toast(message, defaultOptions);
    }
  };

  const success = (message: string, options?: ToastOptions) => {
    return showToast(message, 'success', options);
  };

  const error = (message: string, options?: ToastOptions) => {
    return showToast(message, 'error', options);
  };

  const loading = (message: string, options?: ToastOptions) => {
    return showToast(message, 'loading', options);
  };

  const custom = (message: string, options?: ToastOptions) => {
    return showToast(message, 'custom', options);
  };

  const dismiss = (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  };

  const promise = <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: ToastOptions
  ) => {
    return toast.promise(promise, messages, options);
  };

  return {
    toast: showToast,
    success,
    error,
    loading,
    custom,
    dismiss,
    promise,
  };
};