import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, Thermometer, AlertTriangle } from "lucide-react";

export default function HACCPLanding() {
  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Sistema HACCP</h1>
          <p className="text-muted-foreground">
            Gestione completa conformità HACCP: controlli produzioni, monitoraggio temperature frighi, e tracciabilità inadempienze
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Card Produzioni Settimanali */}
          <Link href="/haccp-productions">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <ClipboardCheck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>Produzioni Settimanali</CardTitle>
                </div>
                <CardDescription>
                  Controlli HACCP per ogni produzione: temperatura conservazione (4°C, -20°C), temperatura cottura, conformità e gestione inadempienza
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  • Schede settimanali (Bozza/Completata/Approvata)<br />
                  • Checkbox controlli temperatura<br />
                  • Modulo inadempienza con azioni correttive<br />
                  • Storico ultime 10 schede
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Card Gestione Frighi */}
          <Link href="/fridges">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
                    <Thermometer className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <CardTitle>Gestione Frighi</CardTitle>
                </div>
                <CardDescription>
                  Anagrafica frighi/freezer, registrazione temperature giornaliere, alert automatici per temperature fuori range
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  • Anagrafica frighi (tipo, ubicazione, range temp)<br />
                  • Registrazione temperature giornaliere<br />
                  • Alert automatici fuori range<br />
                  • Storico temperature con grafici
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Card Gestione Inadempienze */}
          <Link href="/haccp-non-compliance">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle>Gestione Inadempienze</CardTitle>
                </div>
                <CardDescription>
                  Registro completo inadempienze HACCP: temperature fuori range, produzioni non conformi, azioni correttive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  • Registro inadempienze (tipo, gravità, data)<br />
                  • Descrizione problema e causa<br />
                  • Azione correttiva intrapresa<br />
                  • Stato risoluzione (Aperta/In corso/Risolta)
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
