import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { BarChart3, Search } from "lucide-react";
import { useState } from "react";

export default function FoodMatrix() {
  const [search, setSearch] = useState("");
  const { data: items, isLoading } = trpc.foodMatrix.list.useQuery({});

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Food Matrix</h1>
          <p className="text-slate-600 mt-1">Vista unificata di tutti i prodotti</p>
        </div>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Cerca prodotti..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Tutti i Prodotti
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Caricamento...</div>
            ) : items && items.length > 0 ? (
              <div className="grid gap-4">
                {items.map((item: any) => (
                  <div key={item.id} className="p-4 border rounded-lg flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-slate-500">{item.sourceType} - {item.tag}</p>
                    </div>
                    <span className="text-emerald-600 font-semibold">€{parseFloat(item.pricePerKgOrUnit).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>Nessun prodotto nella Food Matrix</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
