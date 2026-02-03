import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import RecipeDetails from "./pages/RecipeDetails";
import ShoppingList from "./pages/ShoppingList";
import Dashboard from "./pages/Dashboard";
import Ingredients from "./pages/Ingredients";
import SemiFinished from "./pages/SemiFinished";
import FinalRecipes from "./pages/FinalRecipes";
import FoodMatrix from "./pages/FoodMatrix";
import Production from "./pages/Production";
import Menu from "./pages/Menu";
import Waste from "./pages/Waste";
import HACCP from "./pages/HACCP";
import Storage from "./pages/Storage";
import Assistant from "./pages/Assistant";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/recipes"} component={RecipeDetails} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/404"} component={NotFound} />
      <Route path={"/ingredients"} component={Ingredients} />
      <Route path={"/semi-finished"} component={SemiFinished} />
      <Route path={"/final-recipes"} component={FinalRecipes} />
      <Route path={"/food-matrix"} component={FoodMatrix} />
      <Route path={"/production"} component={Production} />
      <Route path={"/menu"} component={Menu} />
      <Route path={"/waste"} component={Waste} />
      <Route path={"/haccp"} component={HACCP} />
      <Route path={"/storage"} component={Storage} />
      <Route path={"/shopping-list"} component={ShoppingList} />
      <Route path={"/assistant"} component={Assistant} />
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
