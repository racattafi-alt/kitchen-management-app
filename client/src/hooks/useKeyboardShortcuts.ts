import { useEffect } from "react";
import { useLocation } from "wouter";

interface KeyboardShortcutsOptions {
  enableEscapeBack?: boolean;
  enableSlashSearch?: boolean;
  searchInputId?: string;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const {
    enableEscapeBack = true,
    enableSlashSearch = true,
    searchInputId = "global-search",
  } = options;
  
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC: torna alla dashboard (solo se non in un input/textarea/dialog)
      if (
        enableEscapeBack &&
        event.key === "Escape" &&
        !isInputFocused()
      ) {
        event.preventDefault();
        setLocation("/dashboard");
        return;
      }

      // /: focus sulla ricerca (solo se non in un input/textarea)
      if (
        enableSlashSearch &&
        event.key === "/" &&
        !isInputFocused()
      ) {
        event.preventDefault();
        const searchInput = document.getElementById(searchInputId);
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enableEscapeBack, enableSlashSearch, searchInputId, setLocation]);
}

function isInputFocused(): boolean {
  const activeElement = document.activeElement;
  return (
    activeElement?.tagName === "INPUT" ||
    activeElement?.tagName === "TEXTAREA" ||
    activeElement?.getAttribute("contenteditable") === "true" ||
    activeElement?.closest("[role='dialog']") !== null
  );
}
