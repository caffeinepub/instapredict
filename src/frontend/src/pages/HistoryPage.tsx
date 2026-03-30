import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type Prediction, useGetPredictionHistory } from "@/hooks/useQueries";
import { History, Loader2, Lock, Zap } from "lucide-react";
import { motion } from "motion/react";

interface HistoryPageProps {
  onNavigate: (page: string) => void;
}

function PredictionCard({
  prediction,
  index,
}: { prediction: Prediction; index: number }) {
  const date = prediction.createdAt
    ? new Date(Number(prediction.createdAt) / 1_000_000).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
        },
      )
    : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="glass rounded-xl p-4 gradient-border"
      data-ocid={`history.item.${index + 1}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground">{date}</span>
            <Badge
              variant={prediction.paid ? "default" : "secondary"}
              className="text-xs"
            >
              {prediction.paid ? "✓ Unlocked" : "Locked"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {prediction.contentType}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {(prediction.hashtags || []).slice(0, 5).map((tag) => (
              <span key={tag} className="text-xs text-primary">
                #{tag}
              </span>
            ))}
            {(prediction.hashtags || []).length > 5 && (
              <span className="text-xs text-muted-foreground">
                +{prediction.hashtags.length - 5} more
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          {prediction.paid ? (
            <div>
              <p className="font-display font-bold text-2xl gradient-text">
                {Number(prediction.predictedLikes).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">est. likes</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Locked</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function HistoryPage({ onNavigate }: HistoryPageProps) {
  const { data: predictions, isLoading, isError } = useGetPredictionHistory();

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-3xl">
                Prediction History
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                All your past predictions
              </p>
            </div>
            <Button
              onClick={() => onNavigate("predictor")}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              data-ocid="history.new_prediction.primary_button"
            >
              <Zap className="w-4 h-4 mr-2" fill="white" />
              New
            </Button>
          </div>

          {/* Content */}
          {isLoading && (
            <div className="space-y-3" data-ocid="history.loading_state">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass rounded-xl p-4">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div
              className="glass rounded-xl p-8 text-center"
              data-ocid="history.error_state"
            >
              <p className="text-muted-foreground">
                Failed to load history. Please try again.
              </p>
            </div>
          )}

          {!isLoading &&
            !isError &&
            (!predictions || predictions.length === 0) && (
              <div
                className="glass rounded-2xl p-16 text-center"
                data-ocid="history.empty_state"
              >
                <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-semibold text-lg">No predictions yet</p>
                <p className="text-muted-foreground text-sm mt-1 mb-6">
                  Make your first prediction to see it here
                </p>
                <Button
                  onClick={() => onNavigate("predictor")}
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  data-ocid="history.start.primary_button"
                >
                  <Loader2 className="w-4 h-4 mr-2" />
                  Make a Prediction
                </Button>
              </div>
            )}

          {predictions && predictions.length > 0 && (
            <div className="space-y-3">
              {predictions.map((pred, i) => (
                <PredictionCard key={pred.id} prediction={pred} index={i} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
