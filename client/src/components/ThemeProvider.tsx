import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

type ThemeProviderContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeProviderContext = createContext<
  ThemeProviderContextType | undefined
>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const root = window.document.documentElement;
    const savedTheme =
      (localStorage.getItem("finwise-theme") as Theme) || "dark";

    setTheme(savedTheme);
    root.classList.remove("light", "dark");
    root.classList.add(savedTheme);
  }, []);

  const handleSetTheme = (newTheme: Theme) => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add(newTheme);

    setTheme(newTheme);
    localStorage.setItem("finwise-theme", newTheme);
  };

  const toggleTheme = () => {
    handleSetTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeProviderContext.Provider
      value={{ theme, setTheme: handleSetTheme, toggleTheme }}
    >
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
