"use client";

import { ThemeProvider } from "./theme-provider";
import { SpotlightSearch } from "./SpotlightSearch";
import { BasketProvider } from "@/contexts/basket-context";
import { ToastProvider, Toaster } from "@/components/ui/toast";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider defaultTheme="system">
      <ToastProvider>
        <BasketProvider>
          {children}
          <SpotlightSearch />
          <Toaster />
        </BasketProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default Providers;
