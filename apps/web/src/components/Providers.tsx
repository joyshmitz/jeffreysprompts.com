"use client";

import { ThemeProvider } from "./theme-provider";
import { SpotlightSearch } from "./SpotlightSearch";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider defaultTheme="system">
      {children}
      <SpotlightSearch />
    </ThemeProvider>
  );
}

export default Providers;
