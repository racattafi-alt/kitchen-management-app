import { useState } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export default function MigrateSuppliers() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const migrateMutation = trpc.suppliers.migrateFromIngredients.useMutation();

  const handleMigrate = async () => {
    setLoading(true);
    try {
      const res = await migrateMutation.mutateAsync();
      setResult(res);
    } catch (error: any) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Migrazione Fornitori</h1>
        <p className="mb-4">
          Questo script migra i fornitori dal campo "supplier" degli ingredienti
          alla nuova tabella "suppliers".
        </p>

        <Button onClick={handleMigrate} disabled={loading}>
          {loading ? "Migrazione in corso..." : "Avvia Migrazione"}
        </Button>

        {result && (
          <div className="mt-6 p-4 bg-gray-100 rounded">
            <h2 className="font-bold mb-2">Risultato:</h2>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </Card>
    </div>
  );
}
