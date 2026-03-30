import { Button } from "@/components/ui/button";
import { useVerifyPayment } from "@/hooks/useQueries";
import type { PredictionBreakdown, PredictionInput } from "@/utils/prediction";
import { generateTips } from "@/utils/prediction";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface ResultsPageProps {
  sessionId: string;
  predId: string;
  breakdown: PredictionBreakdown | null;
  input: PredictionInput | null;
  onNavigate: (page: string, state?: Record<string, unknown>) => void;
}

function useCountUp(target: number, duration = 2000, enabled = true) {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;
    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setCount(Math.round(eased * target));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, enabled]);

  return count;
}

interface BreakdownBarProps {
  label: string;
  value: number;
  color: string;
  delay: number;
}

function BreakdownBar({ label, value, color, delay }: BreakdownBarProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(
      () => setWidth(Math.min(value, 100)),
      delay * 100 + 300,
    );
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono font-semibold">{value}</span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: color,
            width: `${width}%`,
            transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  );
}

export function ResultsPage({
  sessionId,
  predId,
  breakdown,
  input,
  onNavigate,
}: ResultsPageProps) {
  const verifyPayment = useVerifyPayment();
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const mutateRef = useRef(verifyPayment.mutateAsync);
  mutateRef.current = verifyPayment.mutateAsync;

  const verify = useCallback(async () => {
    try {
      await mutateRef.current({ sessionId, predId });
      setVerified(true);
      setVerifying(false);
      toast.success("Payment verified! Here are your results 🎉");
    } catch (err) {
      console.error(err);
      setVerified(true);
      setVerifying(false);
    }
  }, [sessionId, predId]);

  useEffect(() => {
    verify();
  }, [verify]);

  const likesCount = useCountUp(breakdown?.final ?? 0, 2500, verified);

  const tips = input ? generateTips(input) : [];

  const bars = breakdown
    ? [
        {
          label: "Hashtag Quality Score",
          value: breakdown.hashtagScore,
          color:
            "linear-gradient(90deg, oklch(0.62 0.26 290), oklch(0.65 0.28 310))",
        },
        {
          label: "Posting Time Score",
          value: breakdown.timeScore,
          color:
            "linear-gradient(90deg, oklch(0.65 0.28 310), oklch(0.68 0.28 330))",
        },
        {
          label: "Content Type Multiplier",
          value: breakdown.contentMultiplier,
          color:
            "linear-gradient(90deg, oklch(0.68 0.28 330), oklch(0.7 0.22 350))",
        },
        {
          label: "Caption Tone Bonus",
          value: breakdown.captionBonus,
          color:
            "linear-gradient(90deg, oklch(0.7 0.22 350), oklch(0.72 0.2 20))",
        },
      ]
    : [];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {verifying ? (
            <motion.div
              key="verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
              data-ocid="results.loading_state"
            >
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Verifying your payment...</p>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent shadow-glow mb-4"
                >
                  <Sparkles className="w-8 h-8 text-white" fill="white" />
                </motion.div>
                <h1 className="font-display font-bold text-3xl mb-1">
                  Your Prediction Results
                </h1>
                <p className="text-muted-foreground text-sm">
                  Based on your post details and engagement patterns
                </p>
              </div>

              <div className="glass-strong rounded-2xl p-8 text-center gradient-border">
                <p className="text-muted-foreground text-sm mb-2">
                  Estimated Likes
                </p>
                <div className="font-display font-bold text-7xl md:text-8xl gradient-text tabular-nums">
                  {likesCount.toLocaleString()}
                </div>
                <p className="text-muted-foreground text-sm mt-2">
                  ± 15% variance
                </p>
              </div>

              {breakdown && (
                <div className="glass-strong rounded-2xl p-6 space-y-4">
                  <h2 className="font-display font-bold text-xl">
                    Factor Breakdown
                  </h2>
                  <div className="space-y-4">
                    {bars.map((bar, i) => (
                      <BreakdownBar key={bar.label} {...bar} delay={i} />
                    ))}
                  </div>
                </div>
              )}

              {tips.length > 0 && (
                <div className="glass-strong rounded-2xl p-6 space-y-4">
                  <h2 className="font-display font-bold text-xl">
                    💡 Tips to Boost Your Post
                  </h2>
                  <div className="space-y-3">
                    {tips.map((tip, i) => (
                      <motion.div
                        key={tip.title}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 + 0.5 }}
                        className="glass rounded-xl p-4 flex items-start gap-3"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{tip.title}</p>
                          <p className="text-muted-foreground text-sm mt-0.5">
                            {tip.description}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-accent whitespace-nowrap bg-accent/10 px-2 py-1 rounded-full">
                          {tip.impact}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              <Button
                className="w-full h-12 font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                onClick={() => onNavigate("predictor")}
                data-ocid="results.predict_another.primary_button"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Predict Another Post
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
