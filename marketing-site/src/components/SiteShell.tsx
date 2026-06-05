"use client";

import { useCallback, useSyncExternalStore } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface SiteShellProps {
  children: React.ReactNode;
}

function subscribeToThemeClass(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getThemeIsDark(): boolean {
  if (typeof document === "undefined") return true;
  return !document.documentElement.classList.contains("light");
}

function getServerThemeIsDark(): boolean {
  return true;
}

export function SiteShell({ children }: SiteShellProps) {
  const isDark = useSyncExternalStore(
    subscribeToThemeClass,
    getThemeIsDark,
    getServerThemeIsDark,
  );

  const toggleTheme = useCallback(() => {
    const root = document.documentElement;
    const willBeDark = root.classList.contains("light");
    if (willBeDark) {
      root.classList.remove("light");
    } else {
      root.classList.add("light");
    }
    try {
      localStorage.setItem("cuit-theme", willBeDark ? "dark" : "light");
    } catch {
      // ignore quota / private-mode failures
    }
  }, []);

  return (
    <>
      <Header isDark={isDark} onToggleTheme={toggleTheme} />
      <main id="main-content" className="flex-1 pt-16">
        {children}
      </main>
      <Footer />
    </>
  );
}
