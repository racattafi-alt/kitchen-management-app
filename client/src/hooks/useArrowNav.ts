import { useCallback, useEffect } from "react";

/**
 * Adds left/right arrow-key navigation when a dialog is open.
 * The callback is called with "prev" or "next" only when the focused
 * element is NOT an input, textarea or select (to avoid interfering with typing).
 */
export function useArrowNav(
  isOpen: boolean,
  onNavigate: (direction: "prev" | "next") => void
) {
  const navigate = useCallback(
    (direction: "prev" | "next") => onNavigate(direction),
    [onNavigate]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        navigate("prev");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        navigate("next");
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, navigate]);
}
