import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSavePrediction } from "@/hooks/useQueries";
import { type PredictionInput, calculatePrediction } from "@/utils/prediction";
import { Hash, Loader2, Plus, X, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

interface PredictorPageProps {
  onNavigate: (page: string, state?: Record<string, unknown>) => void;
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(h: number): string {
  if (h === 0) return "12:00 AM";
  if (h === 12) return "12:00 PM";
  if (h < 12) return `${h}:00 AM`;
  return `${h - 12}:00 PM`;
}

export function PredictorPage({ onNavigate }: PredictorPageProps) {
  const [hashtags, setHashtags] = useState<string[]>([
    "photography",
    "instagood",
    "explore",
  ]);
  const [tagInput, setTagInput] = useState("");
  const [contentType, setContentType] =
    useState<PredictionInput["contentType"]>("Reel");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [hour, setHour] = useState(19);
  const [followerCount, setFollowerCount] = useState("5000");
  const [captionTone, setCaptionTone] =
    useState<PredictionInput["captionTone"]>("Inspirational");
  const [isCalculating, setIsCalculating] = useState(false);

  const savePrediction = useSavePrediction();

  const addHashtag = (raw: string) => {
    const tag = raw.replace(/^#/, "").trim().toLowerCase();
    if (!tag || hashtags.includes(tag) || hashtags.length >= 30) return;
    setHashtags((prev) => [...prev, tag]);
    setTagInput("");
  };

  const removeHashtag = (tag: string) => {
    setHashtags((prev) => prev.filter((t) => t !== tag));
  };

  const handleCalculate = async () => {
    const followers = Number.parseInt(followerCount, 10);
    if (!followers || followers < 1) {
      toast.error("Please enter your follower count");
      return;
    }

    setIsCalculating(true);
    try {
      const input: PredictionInput = {
        hashtags,
        contentType,
        dayOfWeek,
        hour,
        followerCount: followers,
        captionTone,
      };

      const breakdown = calculatePrediction(input);
      const predId = `pred_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const timeOfUpload = `${DAYS[dayOfWeek]} ${hour}:00`;

      await savePrediction.mutateAsync({
        id: predId,
        hashtags,
        contentType,
        timeOfUpload,
        followerCount: followers,
        predictedLikes: breakdown.final,
      });

      onNavigate("payment", { predId, breakdown, input });
    } catch (err) {
      console.error(err);
      const input: PredictionInput = {
        hashtags,
        contentType,
        dayOfWeek,
        hour,
        followerCount: Number.parseInt(followerCount, 10) || 1000,
        captionTone,
      };
      const breakdown = calculatePrediction(input);
      const predId = `pred_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      onNavigate("payment", { predId, breakdown, input });
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <h1 className="font-display font-bold text-4xl md:text-5xl mb-2">
              <span className="gradient-text">Predict Your</span>
              <br />
              <span>Instagram Likes</span>
            </h1>
            <p className="text-muted-foreground">
              Fill in your post details for an AI-powered prediction
            </p>
          </div>

          <div className="glass-strong rounded-2xl p-6 md:p-8 space-y-6 gradient-border">
            {/* Hashtags */}
            <div className="space-y-3" data-ocid="predict.hashtags.panel">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Hash className="w-4 h-4 text-primary" />
                Hashtags
                <span className="text-muted-foreground font-normal">
                  ({hashtags.length}/30)
                </span>
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add hashtag (without #)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === "," || e.key === " ") {
                      e.preventDefault();
                      addHashtag(tagInput);
                    }
                  }}
                  className="bg-input/50 border-border/50 flex-1"
                  data-ocid="predict.hashtag.input"
                />
                <Button
                  size="sm"
                  onClick={() => addHashtag(tagInput)}
                  variant="secondary"
                  data-ocid="predict.hashtag.add_button"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {hashtags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="gap-1 pl-2 pr-1 py-1 cursor-pointer hover:bg-destructive/20 transition-colors group"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeHashtag(tag)}
                      className="opacity-50 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {hashtags.length === 0 && (
                  <span className="text-muted-foreground text-sm">
                    No hashtags added yet
                  </span>
                )}
              </div>
            </div>

            {/* Content Type */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Content Type</Label>
              <Select
                value={contentType}
                onValueChange={(v) =>
                  setContentType(v as PredictionInput["contentType"])
                }
              >
                <SelectTrigger
                  className="bg-input/50 border-border/50"
                  data-ocid="predict.content_type.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    ["Reel", "Carousel", "Video", "Photo", "Story"] as const
                  ).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time of Upload */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Day of Week</Label>
                <Select
                  value={String(dayOfWeek)}
                  onValueChange={(v) => setDayOfWeek(Number(v))}
                >
                  <SelectTrigger
                    className="bg-input/50 border-border/50"
                    data-ocid="predict.day.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day, i) => (
                      <SelectItem key={day} value={String(i)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Hour</Label>
                <Select
                  value={String(hour)}
                  onValueChange={(v) => setHour(Number(v))}
                >
                  <SelectTrigger
                    className="bg-input/50 border-border/50"
                    data-ocid="predict.hour.select"
                  >
                    <SelectValue>{formatHour(hour)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-48">
                    {HOURS.map((h) => (
                      <SelectItem key={`hour-${h}`} value={String(h)}>
                        {formatHour(h)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Follower Count */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Your Follower Count
              </Label>
              <Input
                type="number"
                placeholder="e.g. 10000"
                value={followerCount}
                onChange={(e) => setFollowerCount(e.target.value)}
                min={1}
                className="bg-input/50 border-border/50"
                data-ocid="predict.followers.input"
              />
            </div>

            {/* Caption Tone */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Caption Tone</Label>
              <Select
                value={captionTone}
                onValueChange={(v) =>
                  setCaptionTone(v as PredictionInput["captionTone"])
                }
              >
                <SelectTrigger
                  className="bg-input/50 border-border/50"
                  data-ocid="predict.caption_tone.select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      "Funny",
                      "Inspirational",
                      "Informational",
                      "Promotional",
                      "Personal",
                    ] as const
                  ).map((tone) => (
                    <SelectItem key={tone} value={tone}>
                      {tone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all shadow-glow hover:shadow-glow-pink"
              onClick={handleCalculate}
              disabled={isCalculating}
              data-ocid="predict.calculate.primary_button"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 mr-2" fill="white" /> Calculate My
                  Likes
                </>
              )}
            </Button>
          </div>

          <p className="text-center text-muted-foreground text-xs mt-4">
            Results unlock for $1.99 · Powered by real engagement data
          </p>
        </motion.div>
      </div>
    </div>
  );
}
