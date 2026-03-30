import { Navbar } from "@/components/Navbar";
import { Toaster } from "@/components/ui/sonner";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { HistoryPage } from "@/pages/HistoryPage";
import { LoginPage } from "@/pages/LoginPage";
import { PaymentPage } from "@/pages/PaymentPage";
import { PredictorPage } from "@/pages/PredictorPage";
import { ResultsPage } from "@/pages/ResultsPage";
import type { PredictionBreakdown, PredictionInput } from "@/utils/prediction";
import { useEffect, useState } from "react";

interface AppState {
  page: string;
  predId?: string;
  sessionId?: string;
  breakdown?: PredictionBreakdown;
  input?: PredictionInput;
}

function parseInitialState(): AppState {
  const params = new URLSearchParams(window.location.search);
  const page = params.get("page");
  const sessionId = params.get("session_id") || undefined;
  const predId = params.get("pred_id") || undefined;

  if (page === "results" && sessionId && predId) {
    return { page: "results", sessionId, predId };
  }
  if (page === "predictor") {
    return { page: "predictor" };
  }
  return { page: "login" };
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const [state, setState] = useState<AppState>(parseInitialState);

  useEffect(() => {
    if (!isInitializing && identity) {
      if (state.page === "login") {
        setState({ page: "predictor" });
      }
    }
  }, [identity, isInitializing, state.page]);

  const navigate = (page: string, extra?: Record<string, unknown>) => {
    setState({ page, ...extra } as AppState);
    // Clean URL params when navigating away from results
    if (page !== "results") {
      const url = new URL(window.location.href);
      url.search = "";
      window.history.replaceState({}, "", url.toString());
    }
  };

  const requiresAuth = ["predictor", "payment", "results", "history"].includes(
    state.page,
  );

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (requiresAuth && !identity) {
    return (
      <>
        <LoginPage onSuccess={() => navigate("predictor")} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 50% at 50% 0%, oklch(0.25 0.1 290 / 0.4) 0%, transparent 60%)",
        }}
      />

      {state.page !== "login" && (
        <Navbar currentPage={state.page} onNavigate={navigate} />
      )}

      <main>
        {state.page === "login" && (
          <LoginPage onSuccess={() => navigate("predictor")} />
        )}
        {state.page === "predictor" && <PredictorPage onNavigate={navigate} />}
        {state.page === "payment" &&
          state.predId &&
          state.breakdown &&
          state.input && (
            <PaymentPage
              predId={state.predId}
              breakdown={state.breakdown}
              input={state.input}
              onNavigate={navigate}
            />
          )}
        {state.page === "results" && (
          <ResultsPage
            sessionId={state.sessionId ?? ""}
            predId={state.predId ?? ""}
            breakdown={state.breakdown ?? null}
            input={state.input ?? null}
            onNavigate={navigate}
          />
        )}
        {state.page === "history" && <HistoryPage onNavigate={navigate} />}
      </main>

      {/* Footer */}
      <footer className="pb-8 pt-4 text-center text-xs text-muted-foreground">
        <p>
          © {new Date().getFullYear()}. Built with{" "}
          <span className="text-accent">♥</span> using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </footer>

      <Toaster />
    </div>
  );
}
