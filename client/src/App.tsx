import { Toaster } from "@/components/ui/sonner";
import { useEffect } from "react";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  // GitHub Pages serves the app below the repository name, while Manus serves it at root.
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";
  return (
    <Switch>
      <Route path={basePath} component={Home} />
      {basePath !== "/" && <Route path={`${basePath}/`} component={Home} />}
      <Route path={"/"} component={Home} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function LoginBootstrap() {
  const { user, loading } = useAuth();
  useEffect(() => {
    if (loading || user || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") !== "1") return;
    params.delete("login");
    const nextPath = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", nextPath);
    startLogin();
  }, [loading, user]);
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <LoginBootstrap />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
