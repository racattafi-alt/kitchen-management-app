import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Recipes from "./pages/Recipes";
import ShoppingList from "./pages/ShoppingList";
import Dashboard from "./pages/Dashboard";
import Ingredients from "./pages/Ingredients";

import FinalRecipes from "./pages/FinalRecipes";
import FoodMatrix from "./pages/FoodMatrix";
import ProductionNew from "./pages/ProductionNew";
import Menu from "./pages/Menu";
import Waste from "./pages/Waste";
import HACCPLanding from "./pages/HACCPLanding";
import HACCPProductions from "./pages/HACCPProductions";
import HACCPNonCompliance from "./pages/HACCPNonCompliance";
import Storage from "./pages/Storage";
import Assistant from "./pages/Assistant";
import Suppliers from "./pages/Suppliers";
import CostAnalysisDashboard from "./pages/CostAnalysisDashboard";
import Users from "./pages/Users";
import OrdersNew from "./pages/OrdersNew";
import OrderHistory from "./pages/OrderHistory";
import Invoices from "./pages/Invoices";
import Fridges from "./pages/Fridges";
import DocumentArchive from "./pages/DocumentArchive";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/recipes"} component={Recipes} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/super-admin"} component={SuperAdminDashboard} />
      <Route path={"/404"} component={NotFound} />
      <Route path={"/ingredients"} component={Ingredients} />

      <Route path={"/final-recipes"} component={FinalRecipes} />
      <Route path={"/food-matrix"} component={FoodMatrix} />
      <Route path={"/production"} component={ProductionNew} />
      <Route path={"/menu"} component={Menu} />
      <Route path={"/waste"} component={Waste} />
      <Route path={"/haccp"} component={HACCPLanding} />
      <Route path={"/haccp-productions"} component={HACCPProductions} />
      <Route path={"/haccp-non-compliance"} component={HACCPNonCompliance} />
      <Route path={"/storage"} component={Storage} />
      <Route path={"/shopping-list"} component={ShoppingList} />
      <Route path={"/assistant"} component={Assistant} />
      <Route path={"/suppliers"} component={Suppliers} />
      <Route path={"/cost-analysis"} component={CostAnalysisDashboard} />
      <Route path={"/users"} component={Users} />
      <Route path={"/orders-new"} component={OrdersNew} />
      <Route path={"/order-history"} component={OrderHistory} />
      <Route path={"/invoices"} component={Invoices} />
      <Route path={"/fridges"} component={Fridges} />
      <Route path={"/documents"} component={DocumentArchive} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
