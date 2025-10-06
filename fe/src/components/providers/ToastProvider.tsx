import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      toastOptions={{
        classNames: {
          toast: "shadow-lg",
        },
      }}
    />
  );
}
