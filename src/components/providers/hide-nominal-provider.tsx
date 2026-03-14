"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { HideNominalContextType } from "@/types";

const HideNominalContext = createContext<HideNominalContextType | undefined>(
  undefined
);

const STORAGE_KEY = "expense-tracker-hide-nominal";

interface HideNominalProviderProps {
  children: ReactNode;
}

export function HideNominalProvider({ children }: HideNominalProviderProps) {
  const [state, setState] = useState({ isHidden: false, isLoaded: false });

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const timeout = setTimeout(() => {
      setState({
        isHidden: stored === "true",
        isLoaded: true,
      });
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  const { isHidden, isLoaded } = state;

  const toggle = () =>
    setState((prev) => ({ ...prev, isHidden: !prev.isHidden }));
  const show = () => setState((prev) => ({ ...prev, isHidden: false }));
  const hide = () => setState((prev) => ({ ...prev, isHidden: true }));

  // Save to localStorage when changed
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, String(isHidden));
    }
  }, [isHidden, isLoaded]);

  // Don't render until loaded (prevent hydration mismatch)
  if (!isLoaded) {
    return null;
  }

  return (
    <HideNominalContext.Provider value={{ isHidden, toggle, show, hide }}>
      {children}
    </HideNominalContext.Provider>
  );
}

export function useHideNominal(): HideNominalContextType {
  const context = useContext(HideNominalContext);
  if (context === undefined) {
    throw new Error("useHideNominal must be used within HideNominalProvider");
  }
  return context;
}
