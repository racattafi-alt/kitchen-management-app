import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import {
  ChefHat,
  Calculator,
  ClipboardCheck,
  Package,
  TrendingUp,
  Shield,
  ArrowRight,
  BarChart3,
  Utensils,
  FileText,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="container flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <ChefHat className="h-8 w-8 text-emerald-600" />
              <span className="text-xl font-bold text-slate-900">Kitchen Management</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">Benvenuto, {user?.name || "Utente"}</span>
              <Button onClick={() => setLocation("/dashboard")} className="bg-emerald-600 hover:bg-emerald-700">
                Vai alla Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="container py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">
              Gestione Cucina Professionale
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Controlla costi, produzione e conformità HACCP in un'unica piattaforma integrata.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/ingredients")}>
              <CardHeader>
                <Package className="h-10 w-10 text-emerald-600 mb-2" />
                <CardTitle>Ingredienti</CardTitle>
                <CardDescription>Gestisci materie prime, fornitori e prezzi</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/final-recipes")}>
              <CardHeader>
                <ChefHat className="h-10 w-10 text-orange-600 mb-2" />
                <CardTitle>Ricette Finali</CardTitle>
                <CardDescription>Piatti pronti con calcolo costi automatico</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/food-matrix")}>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-purple-600 mb-2" />
                <CardTitle>Food Matrix</CardTitle>
                <CardDescription>Vista unificata di tutti i prodotti</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/production")}>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-teal-600 mb-2" />
                <CardTitle>Produzione</CardTitle>
                <CardDescription>Pianifica la produzione settimanale</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation("/haccp")}>
              <CardHeader>
                <Shield className="h-10 w-10 text-red-600 mb-2" />
                <CardTitle>HACCP</CardTitle>
                <CardDescription>Conformità e tracciabilità</CardDescription>
              </CardHeader>
            </Card>

            {user?.role === "admin" && (
              <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-red-200" onClick={() => setLocation("/users")}>
                <CardHeader>
                  <Users className="h-10 w-10 text-red-600 mb-2" />
                  <CardTitle className="text-red-900">Gestione Utenti</CardTitle>
                  <CardDescription>Modifica ruoli e permessi (Solo Admin)</CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-3">
          <ChefHat className="h-10 w-10 text-emerald-400" />
          <span className="text-2xl font-bold text-white">Kitchen Management</span>
        </div>
        <Button
          onClick={() => (window.location.href = getLoginUrl())}
          variant="outline"
          className="border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-slate-900"
        >
          Accedi
        </Button>
      </header>

      <main className="container py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Gestione Cucina
            <span className="block text-emerald-400">Professionale</span>
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Piattaforma completa per controllare costi, produzione e conformità HACCP 
            nella tua attività di ristorazione.
          </p>
          <Button
            size="lg"
            onClick={() => (window.location.href = getLoginUrl())}
            className="bg-emerald-500 hover:bg-emerald-600 text-lg px-8 py-6"
          >
            Inizia Ora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <Calculator className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Food Cost Automatico</h3>
            <p className="text-slate-400">
              Calcolo ricorsivo dei costi con propagazione automatica dai livelli base.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <ClipboardCheck className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Conformità HACCP</h3>
            <p className="text-slate-400">
              Generazione automatica di schede HACCP per ogni lotto di produzione.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
            <FileText className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Ricette Gerarchiche</h3>
            <p className="text-slate-400">
              Struttura a livelli per ingredienti, semilavorati e ricette finali.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
