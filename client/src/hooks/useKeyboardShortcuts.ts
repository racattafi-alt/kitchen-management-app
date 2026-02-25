import { useEffect } from "react";
import { useLocation } from "wouter";

interface KeyboardShortcutsOptions {
  enableEscapeBack?: boolean;
  enableSlashSearch?: boolean;
  onOpenSearch?: () => void;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const {
    enableEscapeBack = true,
    enableSlashSearch = true,
    onOpenSearch,
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

      // /: apre ricerca globale (solo se non in un input/textarea)
      if (
        enableSlashSearch &&
        event.key === "/" &&
        !isInputFocused()
      ) {
        event.preventDefault();
        if (onOpenSearch) {
          onOpenSearch();
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enableEscapeBack, enableSlashSearch, onOpenSearch, setLocation]);
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
