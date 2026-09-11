"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";

export type DashboardTheme = "formal" | "artistic";

type DashboardThemeContextValue = {
  theme: DashboardTheme;
  setTheme: (theme: DashboardTheme) => void;
};

const DashboardThemeContext = createContext<DashboardThemeContextValue | null>(null);
const THEME_STORAGE_KEY = "sportmanager-dashboard-theme";
const THEME_CHANGE_EVENT = "sportmanager-dashboard-theme-change";

function getStoredTheme(): DashboardTheme {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return savedTheme === "formal" || savedTheme === "artistic" ? savedTheme : "formal";
}

function getServerTheme(): DashboardTheme {
  return "formal";
}

function subscribeToThemeChanges(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}

export function DashboardThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribeToThemeChanges, getStoredTheme, getServerTheme);

  const value = useMemo(
    () => ({
      theme,
      setTheme: (nextTheme: DashboardTheme) => {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
        window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
      },
    }),
    [theme]
  );

  return (
    <DashboardThemeContext.Provider value={value}>
      <div className="dashboard-theme-root" data-dashboard-theme={theme}>
        {children}
      </div>
    </DashboardThemeContext.Provider>
  );
}

export function useDashboardTheme() {
  const context = useContext(DashboardThemeContext);
  if (!context) {
    throw new Error("useDashboardTheme debe usarse dentro de DashboardThemeProvider");
  }
  return context;
}
