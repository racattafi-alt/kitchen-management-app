import { useStore } from "@/contexts/StoreContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, Check, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function StoreSelector() {
  const { currentStoreId, setCurrentStoreId, stores, isLoading } = useStore();

  if (isLoading || stores.length === 0) {
    return null;
  }

  // Non mostrare selector se c'è un solo store
  if (stores.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <div className="flex items-center gap-2 flex-1">
          <Store className="h-4 w-4 text-primary" />
          <span className="font-medium">{stores[0].storeName}</span>
        </div>
        <Badge variant="default" className="bg-green-600 hover:bg-green-600 text-white">
          <Check className="h-3 w-3 mr-1" />
          Attivo
        </Badge>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <Select value={currentStoreId || undefined} onValueChange={setCurrentStoreId}>
        <SelectTrigger className="w-full">
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-primary" />
              <SelectValue placeholder="Seleziona punto vendita" />
            </div>
            {currentStoreId && (
              <Badge variant="default" className="bg-green-600 hover:bg-green-600 text-white text-xs">
                <Check className="h-3 w-3 mr-1" />
                Attivo
              </Badge>
            )}
          </div>
        </SelectTrigger>
        <SelectContent>
          {stores.map((store) => {
            const isGlobal = (store as any).storeIsGlobal === true;
            return (
              <SelectItem key={store.storeId} value={store.storeId}>
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="flex items-center gap-2">
                    {isGlobal
                      ? <Globe className="h-4 w-4 text-amber-500 shrink-0" />
                      : <Store className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <div className="flex flex-col">
                      <span className="font-medium">{store.storeName}</span>
                      {isGlobal
                        ? <span className="text-xs text-amber-600 font-semibold">Globale</span>
                        : <span className="text-xs text-muted-foreground capitalize">{store.role}</span>}
                    </div>
                  </div>
                  {currentStoreId === store.storeId && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
