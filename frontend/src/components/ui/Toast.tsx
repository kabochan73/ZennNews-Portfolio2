"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

/** How long a toast stays on screen. */
export const TOAST_DURATION_MS = 3000;

type ToastContextValue = { showToast: (message: string) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

/** Shows short notices at the bottom of the screen for a few seconds. */
export function ToastProvider({ children }: { children: ReactNode }) {
  // A new object per call, so the same message twice still restarts the timer.
  const [toast, setToast] = useState<{ message: string } | null>(null);

  const showToast = useCallback((message: string) => {
    setToast({ message });
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS);

    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 lg:bottom-8"
      >
        {toast && (
          <p className="rounded-full bg-black px-5 py-3 text-sm text-white shadow-lg">
            {toast.message}
          </p>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }

  return context;
}
