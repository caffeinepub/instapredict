import { clearPaymentState, savePaymentState } from "@/App";
import { Button } from "@/components/ui/button";
import { useActor } from "@/hooks/useActor";
import type { PredictionBreakdown, PredictionInput } from "@/utils/prediction";
import { ArrowLeft, Loader2, Lock, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const RAZORPAY_KEY_ID = "rzp_test_SXNTwwkvN5SoSo";

interface PaymentPageProps {
  predId: string;
  breakdown: PredictionBreakdown;
  input: PredictionInput;
  razorpayRedirect?: boolean;
  onNavigate: (page: string, state?: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

function isMobileDevice(): boolean {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ) || window.innerWidth < 768
  );
}

// Wait for Razorpay to be available (loaded via index.html script tag)
function waitForRazorpay(timeoutMs = 10000): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      if (window.Razorpay) {
        clearInterval(interval);
        resolve(true);
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        // Fallback: inject script dynamically
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      }
    }, 100);
  });
}

export function PaymentPage({
  predId,
  breakdown,
  input,
  razorpayRedirect,
  onNavigate,
}: PaymentPageProps) {
  const { actor } = useActor();
  const actorRef = useRef<typeof actor>(actor);
  actorRef.current = actor;

  const [isProcessing, setIsProcessing] = useState(false);
  const [redirectVerifying, setRedirectVerifying] = useState(false);
  const redirectHandled = useRef(false);

  // Handle returning from Razorpay mobile redirect
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run once on mount
  useEffect(() => {
    if (!razorpayRedirect || redirectHandled.current) return;

    const params = new URLSearchParams(window.location.search);
    const storedParams = sessionStorage.getItem("instapred_rzp_params");
    const paymentId =
      params.get("razorpay_payment_id") ||
      (storedParams ? JSON.parse(storedParams).razorpay_payment_id : null);

    if (!paymentId) return;

    redirectHandled.current = true;
    setRedirectVerifying(true);
    sessionStorage.removeItem("instapred_rzp_params");
    clearPaymentState();

    try {
      actorRef.current?.markPredictionPaid(predId);
    } catch (_) {
      // ignore
    }

    toast.success("Payment successful! Unlocking your results...");
    onNavigate("results", { predId, breakdown, input, paid: true });
  }, [razorpayRedirect]);

  const openRazorpayMobile = () => {
    savePaymentState({ predId, breakdown, input });
    const callbackUrl = window.location.origin + window.location.pathname;
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: 9900,
      currency: "INR",
      name: "InstaPredict",
      description: "Unlock your Instagram likes prediction",
      redirect: true,
      callback_url: callbackUrl,
      prefill: { name: "", email: "", contact: "" },
      theme: { color: "#7c3aed" },
    };
    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response: { error: { description: string } }) => {
      toast.error(response.error.description || "Payment failed.");
      setIsProcessing(false);
    });
    rzp.open();
    // isProcessing stays true — user will be redirected
  };

  const openRazorpayDesktop = () => {
    return new Promise<void>((resolve, reject) => {
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: 9900,
        currency: "INR",
        name: "InstaPredict",
        description: "Unlock your Instagram likes prediction",
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            actorRef.current?.markPredictionPaid(predId);
          } catch (_) {
            // ignore
          }
          toast.success("Payment successful! Unlocking your results...");
          onNavigate("results", { predId, breakdown, input, paid: true });
          resolve();
          void response;
        },
        prefill: { name: "", email: "", contact: "" },
        theme: { color: "#7c3aed" },
        modal: {
          ondismiss: () => reject(new Error("Payment cancelled.")),
          escape: true,
          animation: true,
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.on(
        "payment.failed",
        (response: { error: { description: string } }) => {
          reject(new Error(response.error.description || "Payment failed."));
        },
      );
      rzp.open();
    });
  };

  const handleUnlock = async () => {
    setIsProcessing(true);
    try {
      const ready = await waitForRazorpay(8000);
      if (!ready || !window.Razorpay) {
        throw new Error(
          "Razorpay could not be loaded. Please check your internet connection and try again.",
        );
      }
      if (isMobileDevice()) {
        openRazorpayMobile();
      } else {
        await openRazorpayDesktop();
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Payment failed. Please try again.";
      if (!message.includes("cancelled")) toast.error(message);
      setIsProcessing(false);
    }
  };

  const teaserLow = Math.floor(breakdown.final * 0.7);
  const teaserHigh = Math.ceil(breakdown.final * 1.3);

  if (redirectVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-muted-foreground text-sm text-center">
          Verifying your payment…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <button
            type="button"
            onClick={() => onNavigate("predictor")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            data-ocid="payment.back.button"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Predictor
          </button>

          <div className="text-center">
            <h1 className="font-display font-bold text-3xl mb-2">
              Your Prediction is Ready!
            </h1>
            <p className="text-muted-foreground">
              Unlock your full results for just ₹99
            </p>
          </div>

          <div className="glass-strong rounded-2xl p-8 gradient-border relative overflow-hidden">
            <div className="blur-sm select-none pointer-events-none">
              <div className="text-center mb-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Estimated Likes
                </p>
                <div className="font-display font-bold text-7xl gradient-text">
                  {teaserLow.toLocaleString()}&ndash;
                  {teaserHigh.toLocaleString()}
                </div>
              </div>
              <div className="space-y-3">
                {[
                  "Hashtag Quality",
                  "Timing Score",
                  "Content Type",
                  "Caption Impact",
                ].map((label, i) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-28">
                      {label}
                    </span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                        style={{ width: `${[72, 85, 60, 45][i]}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono w-8">
                      {[72, 85, 60, 45][i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[2px] rounded-2xl">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow mb-3"
              >
                <Lock className="w-8 h-8 text-white" />
              </motion.div>
              <p className="font-semibold text-lg">Results Locked</p>
              <p className="text-muted-foreground text-sm">
                Unlock to see your prediction
              </p>
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" /> What you&apos;ll get
              for ₹99
            </h3>
            <ul className="space-y-2">
              {[
                "Exact predicted likes count with confidence range",
                "Factor-by-factor breakdown chart",
                "5 personalized tips to boost your post",
                "Saved to your history forever",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="text-accent mt-0.5">&#x2713;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="glass rounded-2xl p-5 text-sm">
            <h3 className="font-semibold mb-3">Your Post Details</h3>
            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
              <span>Content:</span>
              <span className="text-foreground font-medium">
                {input.contentType}
              </span>
              <span>Hashtags:</span>
              <span className="text-foreground font-medium">
                {input.hashtags.length} tags
              </span>
              <span>Followers:</span>
              <span className="text-foreground font-medium">
                {input.followerCount.toLocaleString()}
              </span>
              <span>Caption:</span>
              <span className="text-foreground font-medium">
                {input.captionTone}
              </span>
            </div>
          </div>

          <Button
            className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-glow"
            onClick={handleUnlock}
            disabled={isProcessing}
            data-ocid="payment.unlock.primary_button"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>₹99 &mdash; Pay &amp; Unlock Results</>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Secure payment via Razorpay &middot; UPI, Cards, NetBanking &middot;
            One-time payment
          </p>
        </motion.div>
      </div>
    </div>
  );
}
