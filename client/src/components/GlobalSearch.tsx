import { useState, useEffect, useRef } from "react";
import { Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  // Query dati
  const { data: ingredients = [] } = trpc.ingredients.list.useQuery(undefined, { enabled: open });
  const { data: suppliers = [] } = trpc.suppliers.list.useQuery(undefined, { enabled: open });
  const { data: recipes = [] } = trpc.finalRecipes.list.useQuery(undefined, { enabled: open });

  // Filtra risultati
  const results = query.trim()
    ? [
        ...ingredients
          .filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
          .map((i) => ({ type: "Ingrediente", name: i.name, url: "/ingredients" })),
        ...suppliers
          .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
          .map((s) => ({ type: "Fornitore", name: s.name, url: "/suppliers" })),
        ...recipes
          .filter((r) => r.name.toLowerCase().includes(query.toLowerCase()))
          .map((r) => ({ type: "Ricetta", name: r.name, url: "/final-recipes" })),
      ].slice(0, 10)
    : [];

  // Reset quando si apre/chiude
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        setLocation(results[selectedIndex].url);
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, results, selectedIndex, setLocation, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ricerca Globale</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Cerca ingredienti, fornitori, ricette..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              className="pl-10"
            />
          </div>

          {results.length > 0 && (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.name}-${index}`}
                  onClick={() => {
                    setLocation(result.url);
                    onOpenChange(false);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                    index === selectedIndex
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium px-2 py-1 rounded bg-muted text-muted-foreground">
                      {result.type}
                    </span>
                    <span className="font-medium">{result.name}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-50" />
                </button>
              ))}
            </div>
          )}

          {query.trim() && results.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nessun risultato trovato per "{query}"
            </div>
          )}

          {!query.trim() && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Inizia a digitare per cercare ingredienti, fornitori o ricette
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
