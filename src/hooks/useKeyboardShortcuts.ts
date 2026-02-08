import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "k":
            e.preventDefault();
            // Focus search input if on history page
            document.querySelector<HTMLInputElement>("[data-search-input]")?.focus();
            break;
          case "n":
            e.preventDefault();
            navigate("/");
            break;
          case "h":
            e.preventDefault();
            navigate("/history");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);
}
