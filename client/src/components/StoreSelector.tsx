import { useStore } from "@/contexts/StoreContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store } from "lucide-react";

export default function StoreSelector() {
  const { currentStoreId, setCurrentStoreId, stores, isLoading } = useStore();

  if (isLoading || stores.length === 0) {
    return null;
  }

  // Non mostrare selector se c'è un solo store
  if (stores.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Store className="h-4 w-4" />
        <span>{stores[0].storeName}</span>
      </div>
    );
  }

  return (
    <div className="px-3 py-2">
      <Select value={currentStoreId || undefined} onValueChange={setCurrentStoreId}>
        <SelectTrigger className="w-full">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <SelectValue placeholder="Seleziona punto vendita" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {stores.map((store) => (
            <SelectItem key={store.storeId} value={store.storeId}>
              <div className="flex flex-col">
                <span className="font-medium">{store.storeName}</span>
                <span className="text-xs text-muted-foreground capitalize">{store.role}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
