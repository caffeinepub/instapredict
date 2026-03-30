import { Button } from "@/components/ui/button";
import { useCreateCheckout } from "@/hooks/useQueries";
import type { PredictionBreakdown, PredictionInput } from "@/utils/prediction";
import { ArrowLeft, Loader2, Lock, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

interface PaymentPageProps {
  predId: string;
  breakdown: PredictionBreakdown;
  input: PredictionInput;
  onNavigate: (page: string, state?: Record<string, unknown>) => void;
}

export function PaymentPage({
  predId,
  breakdown,
  input,
  onNavigate,
}: PaymentPageProps) {
  const createCheckout = useCreateCheckout();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleUnlock = async () => {
    setIsRedirecting(true);
    try {
      const origin = window.location.origin;
      const successUrl = `${origin}?session_id={CHECKOUT_SESSION_ID}&pred_id=${predId}&page=results`;
      const cancelUrl = `${origin}?page=predictor`;

      const raw = await createCheckout.mutateAsync({
        predId,
        successUrl,
        cancelUrl,
      });

      // Backend returns the full Stripe JSON response; extract the checkout URL
      let checkoutUrl: string | null = null;
      try {
        const parsed = JSON.parse(raw);
        checkoutUrl = parsed.url ?? null;
      } catch {
        // If it's already a plain URL string, use it directly
        if (typeof raw === "string" && raw.startsWith("http")) {
          checkoutUrl = raw;
        }
      }

      if (!checkoutUrl) {
        throw new Error("No checkout URL returned from Stripe");
      }

      window.location.href = checkoutUrl;
    } catch (err) {
      console.error(err);
      toast.error("Payment setup failed. Please try again.");
      setIsRedirecting(false);
    }
  };

  const teaserLow = Math.floor(breakdown.final * 0.7);
  const teaserHigh = Math.ceil(breakdown.final * 1.3);

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
            <ArrowLeft className="w-4 h-4" />
            Back to Predictor
          </button>

          <div className="text-center">
            <h1 className="font-display font-bold text-3xl mb-2">
              Your Prediction is Ready!
            </h1>
            <p className="text-muted-foreground">
              Unlock your full results for just $1.99
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
              <Sparkles className="w-4 h-4 text-accent" />
              What you&apos;ll get for $1.99
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
            disabled={isRedirecting}
            data-ocid="payment.unlock.primary_button"
          >
            {isRedirecting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Redirecting to
                payment...
              </>
            ) : (
              <>&nbsp;Unlock Results for $1.99</>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Secure payment via Stripe &middot; No subscription &middot; One-time
            payment
          </p>
        </motion.div>
      </div>
    </div>
  );
}
