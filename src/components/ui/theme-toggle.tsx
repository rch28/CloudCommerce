"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(isDark ? "light" : "dark")} className="h-9 w-9">
      {isDark ? (
        <Sun size={16} className="text-muted-foreground" />
      ) : (
        <Moon size={16} className="text-muted-foreground" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
