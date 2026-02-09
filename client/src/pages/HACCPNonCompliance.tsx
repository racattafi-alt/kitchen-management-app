import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Plus } from "lucide-react";

export default function HACCPNonCompliance() {
  // Placeholder per future implementazioni
  const [nonCompliances] = useState<any[]>([]);

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestione Inadempienze HACCP</h1>
            <p className="text-muted-foreground">
              Registro completo inadempienze: temperature fuori range, produzioni non conformi, azioni correttive
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuova Inadempienza
          </Button>
        </div>

        {nonCompliances.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nessuna inadempienza registrata</h3>
                <p className="text-muted-foreground mb-4">
                  Le inadempienze vengono create automaticamente quando:
                </p>
                <ul className="text-sm text-muted-foreground text-left max-w-md mx-auto space-y-2">
                  <li>• Una produzione viene marcata come "Non Conforme" nei controlli HACCP</li>
                  <li>• Una temperatura frigo/freezer è fuori range</li>
                  <li>• Viene registrata manualmente un'inadempienza</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {nonCompliances.map((nc: any) => (
              <Card key={nc.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        {nc.type}
                      </CardTitle>
                      <CardDescription>{nc.date}</CardDescription>
                    </div>
                    <Badge variant={nc.status === "Risolta" ? "default" : "destructive"}>
                      {nc.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Descrizione problema:</p>
                      <p className="text-sm text-muted-foreground">{nc.description}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Azione correttiva:</p>
                      <p className="text-sm text-muted-foreground">{nc.correctiveAction}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
