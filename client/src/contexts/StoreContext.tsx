import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

interface StoreContextType {
  currentStoreId: string | null;
  setCurrentStoreId: (storeId: string) => void;
  stores: Array<{
    storeId: string;
    storeName: string;
    role: string;
  }>;
  isLoading: boolean;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [currentStoreId, setCurrentStoreIdState] = useState<string | null>(null);

  // Recuperare stores accessibili dall'utente
  const { data: stores = [], isLoading: storesLoading } = trpc.stores.list.useQuery();

  // Recuperare store preferito
  const { data: preferredStore, isLoading: preferredLoading } = trpc.stores.getPreferred.useQuery();

  // Mutation per impostare store preferito
  const setPreferredMutation = trpc.stores.setPreferred.useMutation();

  // Inizializzare currentStoreId con store preferito o localStorage
  useEffect(() => {
    if (preferredStore?.storeId) {
      setCurrentStoreIdState(preferredStore.storeId);
      localStorage.setItem("currentStoreId", preferredStore.storeId);
    } else {
      // Fallback a localStorage
      const savedStoreId = localStorage.getItem("currentStoreId");
      if (savedStoreId && stores.some((s) => s.storeId === savedStoreId)) {
        setCurrentStoreIdState(savedStoreId);
      } else if (stores.length > 0) {
        // Usare primo store disponibile
        setCurrentStoreIdState(stores[0].storeId);
        localStorage.setItem("currentStoreId", stores[0].storeId);
      }
    }
  }, [preferredStore, stores]);

  const setCurrentStoreId = async (storeId: string) => {
    setCurrentStoreIdState(storeId);
    localStorage.setItem("currentStoreId", storeId);

    // Salvare preferenza nel backend
    try {
      await setPreferredMutation.mutateAsync({ storeId });
    } catch (error) {
      console.error("Errore salvataggio store preferito:", error);
    }
  };

  const isLoading = storesLoading || preferredLoading;

  return (
    <StoreContext.Provider
      value={{
        currentStoreId,
        setCurrentStoreId,
        stores,
        isLoading,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useStore deve essere usato all'interno di StoreProvider");
  }
  return context;
}
