import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  Package,
  Utensils,
  ChefHat,
  TrendingUp,
  AlertTriangle,
  Calendar,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: ingredients } = trpc.ingredients.list.useQuery();
  const { data: semiFinished } = trpc.semiFinished.list.useQuery();
  const { data: finalRecipes } = trpc.finalRecipes.list.useQuery();
  const { data: productions } = trpc.production.list.useQuery({});

  const canViewPrices = user?.role === "admin" || user?.role === "manager";

  const stats = [
    {
      title: "Ingredienti",
      value: ingredients?.length || 0,
      icon: Package,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      href: "/ingredients",
    },
    {
      title: "Semilavorati",
      value: semiFinished?.length || 0,
      icon: Utensils,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/semi-finished",
    },
    {
      title: "Ricette Finali",
      value: finalRecipes?.length || 0,
      icon: ChefHat,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      href: "/final-recipes",
    },
    {
      title: "Produzioni Attive",
      value: productions?.filter((p: any) => p.status === "PLANNED" || p.status === "IN_PRODUCTION").length || 0,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      href: "/production",
    },
  ];



  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-600 mt-1">
            Panoramica della tua cucina professionale
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <Card
              key={stat.title}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setLocation(stat.href)}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Produzione Settimanale
              </CardTitle>
              <CardDescription>Pianificazione corrente</CardDescription>
            </CardHeader>
            <CardContent>
              {productions && productions.length > 0 ? (
                <div className="space-y-3">
                  {productions.slice(0, 5).map((prod: any) => (
                    <div
                      key={prod.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-slate-900">{prod.recipeFinalId}</p>
                        <p className="text-sm text-slate-500">
                          Quantità: {prod.desiredQuantity} {prod.unitType === "k" ? "kg" : "unità"}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          prod.status === "COMPLETED"
                            ? "bg-green-100 text-green-700"
                            : prod.status === "IN_PRODUCTION"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {prod.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>Nessuna produzione pianificata</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setLocation("/production")}
                  >
                    Pianifica Produzione
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Alert HACCP
              </CardTitle>
              <CardDescription>Scadenze e controlli</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-slate-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                <p>Nessun alert attivo</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setLocation("/haccp")}
                >
                  Gestisci HACCP
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {canViewPrices && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Statistiche Food Cost
              </CardTitle>
              <CardDescription>Analisi dei costi di produzione</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-700">
                    {ingredients?.length || 0}
                  </p>
                  <p className="text-sm text-emerald-600">Ingredienti Attivi</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-700">
                    {semiFinished?.length || 0}
                  </p>
                  <p className="text-sm text-blue-600">Semilavorati</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-700">
                    {finalRecipes?.length || 0}
                  </p>
                  <p className="text-sm text-orange-600">Ricette Finali</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
