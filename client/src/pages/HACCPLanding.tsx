import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, Thermometer, AlertTriangle } from "lucide-react";

export default function HACCPLanding() {
  return (
    <DashboardLayout>
      <div className="container py-4 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Sistema HACCP</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Gestione completa conformità HACCP: controlli produzioni, monitoraggio temperature frighi, e tracciabilità inadempienze
          </p>
        </div>

        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {/* Card Produzioni Settimanali */}
          <Link href="/haccp-productions">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader className="pb-3 md:pb-4">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <div className="p-2 md:p-3 bg-blue-100 dark:bg-blue-900 rounded-lg flex-shrink-0">
                    <ClipboardCheck className="h-5 w-5 md:h-6 md:w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-base md:text-lg">Produzioni Settimanali</CardTitle>
                </div>
                <CardDescription className="text-xs md:text-sm">
                  Controlli HACCP per ogni produzione: temperatura conservazione (4°C, -20°C), temperatura cottura, conformità e gestione inadempienza
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs md:text-sm text-muted-foreground">
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
              <CardHeader className="pb-3 md:pb-4">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <div className="p-2 md:p-3 bg-cyan-100 dark:bg-cyan-900 rounded-lg flex-shrink-0">
                    <Thermometer className="h-5 w-5 md:h-6 md:w-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <CardTitle className="text-base md:text-lg">Gestione Frighi</CardTitle>
                </div>
                <CardDescription className="text-xs md:text-sm">
                  Anagrafica frighi/freezer, registrazione temperature giornaliere, alert automatici per temperature fuori range
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs md:text-sm text-muted-foreground">
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
              <CardHeader className="pb-3 md:pb-4">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <div className="p-2 md:p-3 bg-red-100 dark:bg-red-900 rounded-lg flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 md:h-6 md:w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle className="text-base md:text-lg">Gestione Inadempienze</CardTitle>
                </div>
                <CardDescription className="text-xs md:text-sm">
                  Registro completo inadempienze HACCP: temperature fuori range, produzioni non conformi, azioni correttive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs md:text-sm text-muted-foreground">
                  • Registro inadempienze (tipo, gravità, data)<br />
                  • Descrizione problema e causa<br />
                  • Azione correttiva intrapresa<br />
                  • Stato risoluzione (Aperta/In corso/Risolta)
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Card Archivio Documenti */}
          <Link href="/documents">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
              <CardHeader className="pb-3 md:pb-4">
                <div className="flex items-center gap-2 md:gap-3 mb-2">
                  <div className="p-2 md:p-3 bg-purple-100 dark:bg-purple-900 rounded-lg flex-shrink-0">
                    <svg className="h-5 w-5 md:h-6 md:w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <CardTitle className="text-base md:text-lg">Archivio Documenti</CardTitle>
                </div>
                <CardDescription className="text-xs md:text-sm">
                  Archivio completo documenti normativi: certificati sanitari, permessi, storico controlli forze dell'ordine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs md:text-sm text-muted-foreground">
                  • 3 categorie predefinite (Sanitari, Permessi, Storico Controlli)<br />
                  • Upload PDF e immagini (max 16MB)<br />
                  • Alert automatici scadenze<br />
                  • Storage sicuro su S3
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
