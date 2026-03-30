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
  breakdown?: PredictionBreakdown;
  input?: PredictionInput;
  paid?: boolean;
  razorpayRedirect?: boolean;
}

const PAYMENT_STATE_KEY = "instapred_payment_state";

function parseInitialState(): AppState {
  // Check if returning from a Razorpay mobile redirect
  const params = new URLSearchParams(window.location.search);
  const paymentId = params.get("razorpay_payment_id");
  if (paymentId) {
    const saved = sessionStorage.getItem(PAYMENT_STATE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AppState;
        // Clean up URL without reload
        window.history.replaceState({}, "", window.location.pathname);
        return { ...parsed, page: "payment", razorpayRedirect: true };
      } catch {
        // fall through
      }
    }
  }
  return { page: "login" };
}

export const savePaymentState = (
  state: Omit<AppState, "page" | "razorpayRedirect">,
) => {
  sessionStorage.setItem(PAYMENT_STATE_KEY, JSON.stringify(state));
};

export const clearPaymentState = () => {
  sessionStorage.removeItem(PAYMENT_STATE_KEY);
};

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
              razorpayRedirect={state.razorpayRedirect}
              onNavigate={navigate}
            />
          )}
        {state.page === "results" && (
          <ResultsPage
            predId={state.predId ?? ""}
            breakdown={state.breakdown ?? null}
            input={state.input ?? null}
            paid={state.paid ?? false}
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
