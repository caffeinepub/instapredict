export interface PredictionInput {
  hashtags: string[];
  contentType: "Photo" | "Reel" | "Carousel" | "Story" | "Video";
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  hour: number; // 0-23
  followerCount: number;
  captionTone:
    | "Funny"
    | "Inspirational"
    | "Informational"
    | "Promotional"
    | "Personal";
}

export interface PredictionBreakdown {
  base: number;
  hashtagScore: number;
  timeScore: number;
  contentMultiplier: number;
  captionBonus: number;
  variance: number;
  final: number;
}

export interface PredictionTip {
  title: string;
  description: string;
  impact: string;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function calculatePrediction(
  input: PredictionInput,
): PredictionBreakdown {
  const base = input.followerCount * 0.03;

  // Hashtag score
  let hashtagScore: number;
  const count = input.hashtags.length;
  if (count === 0) hashtagScore = 0.7;
  else if (count <= 5) hashtagScore = 1.0;
  else if (count <= 15) hashtagScore = 1.3;
  else hashtagScore = 1.1;

  // Niche hashtag bonus: simulate with seeded random
  const nicheBonus = input.hashtags.reduce((acc, tag, i) => {
    const r = seededRandom(tag.length * (i + 1) * 7);
    return acc + (r > 0.6 ? 0.05 : 0);
  }, 0);
  hashtagScore = Math.min(hashtagScore + nicheBonus, 2.0);

  // Time score
  const isWeekend = input.dayOfWeek === 0 || input.dayOfWeek === 6;
  let timeScore: number;
  if (
    !isWeekend &&
    ((input.hour >= 6 && input.hour < 9) ||
      (input.hour >= 18 && input.hour < 21))
  ) {
    timeScore = 1.4;
  } else if (isWeekend && input.hour >= 10 && input.hour < 14) {
    timeScore = 1.3;
  } else {
    timeScore = 0.8;
  }

  // Content multiplier
  const contentMultipliers: Record<string, number> = {
    Reel: 1.6,
    Carousel: 1.4,
    Video: 1.3,
    Photo: 1.0,
    Story: 0.5,
  };
  const contentMultiplier = contentMultipliers[input.contentType] ?? 1.0;

  // Caption bonus
  const captionBonuses: Record<string, number> = {
    Funny: 1.08,
    Inspirational: 1.1,
    Personal: 1.12,
    Informational: 1.05,
    Promotional: 0.95,
  };
  const captionBonus = captionBonuses[input.captionTone] ?? 1.0;

  // Variance seed based on inputs
  const seed =
    input.hashtags.join("").length + input.followerCount + input.hour;
  const variance = 0.85 + seededRandom(seed) * 0.3; // ±15%

  const final = Math.round(
    base *
      hashtagScore *
      timeScore *
      contentMultiplier *
      captionBonus *
      variance,
  );

  return {
    base: Math.round(base),
    hashtagScore: Math.round(hashtagScore * 100),
    timeScore: Math.round(timeScore * 100),
    contentMultiplier: Math.round(contentMultiplier * 100),
    captionBonus: Math.round(captionBonus * 100),
    variance: Math.round(variance * 100),
    final: Math.max(final, 0),
  };
}

export function generateTips(input: PredictionInput): PredictionTip[] {
  const tips: PredictionTip[] = [];

  const isWeekend = input.dayOfWeek === 0 || input.dayOfWeek === 6;
  const isPeakTime =
    (!isWeekend &&
      ((input.hour >= 6 && input.hour < 9) ||
        (input.hour >= 18 && input.hour < 21))) ||
    (isWeekend && input.hour >= 10 && input.hour < 14);

  if (!isPeakTime) {
    tips.push({
      title: "⏰ Optimize Your Posting Time",
      description:
        "Post on weekdays between 6–9 AM or 6–9 PM for peak engagement.",
      impact: "+40% more reach",
    });
  }

  if (input.hashtags.length < 6 || input.hashtags.length > 15) {
    tips.push({
      title: "#️⃣ Perfect Your Hashtag Count",
      description:
        "Use 6–15 hashtags for the sweet spot. Mix niche (< 500k posts) with popular tags.",
      impact: "+30% discoverability",
    });
  }

  if (input.contentType === "Photo" || input.contentType === "Story") {
    tips.push({
      title: "🎬 Switch to Reels or Carousels",
      description:
        "Reels get 1.6x more likes than photos. Try creating a short video version.",
      impact: "+60% engagement",
    });
  }

  if (input.captionTone === "Promotional") {
    tips.push({
      title: "✍️ Adjust Your Caption Tone",
      description:
        "Personal or inspirational captions outperform promotional ones significantly.",
      impact: "+17% engagement",
    });
  }

  tips.push({
    title: "💬 Engage in the First Hour",
    description:
      "Reply to every comment in the first 60 minutes. The algorithm rewards fast engagement.",
    impact: "+25% algorithmic boost",
  });

  if (input.followerCount < 10000) {
    tips.push({
      title: "👥 Collaborate with Micro-Influencers",
      description:
        "Partner with accounts in your niche for shoutouts to grow your audience faster.",
      impact: "+15% follower growth",
    });
  }

  return tips.slice(0, 5);
}
