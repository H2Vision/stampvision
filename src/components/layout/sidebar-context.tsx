"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface SidebarContextValue {
  /** Mobile drawer open */
  mobileOpen: boolean;
  /** Desktop icon-only collapsed mode */
  collapsed: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  toggleMobile: () => void;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed]   = useState(false);

  const openMobile      = useCallback(() => setMobileOpen(true),  []);
  const closeMobile     = useCallback(() => setMobileOpen(false), []);
  const toggleMobile    = useCallback(() => setMobileOpen((v) => !v), []);
  const toggleCollapsed = useCallback(() => setCollapsed((v)   => !v), []);

  return (
    <SidebarContext.Provider
      value={{ mobileOpen, collapsed, openMobile, closeMobile, toggleMobile, toggleCollapsed }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used inside <SidebarProvider>");
  return ctx;
}
