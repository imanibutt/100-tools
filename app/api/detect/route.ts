import { NextRequest, NextResponse } from "next/server";

// Simple style heuristic based on statistical analysis.
// This is not a real detector; it only flags formulaic writing patterns.
function detectAI(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  if (sentences.length < 3) return 50; // too short to analyze

  // 1. Sentence length variance (burstiness)
  const lengths = sentences.map((s) => s.trim().split(/\s+/).length);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((a, b) => a + Math.pow(b - avgLen, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  const burstiness = stdDev / avgLen; // coefficient of variation

  // 2. Vocabulary richness (type-token ratio)
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const uniqueWords = new Set(words);
  const ttr = uniqueWords.size / words.length;

  // 3. Transition word frequency (AI overuses these)
  const aiTransitions = [
    "however",
    "furthermore",
    "moreover",
    "additionally",
    "consequently",
    "nevertheless",
    "in conclusion",
    "it is important to note",
    "it is worth noting",
    "in summary",
    "overall",
    "significantly",
  ];
  const lowerText = text.toLowerCase();
  const transitionCount = aiTransitions.reduce(
    (count, t) => count + (lowerText.split(t).length - 1),
    0
  );
  const transitionDensity = transitionCount / sentences.length;

  // 4. Contraction usage (humans use more contractions)
  const contractions = [
    "don't",
    "won't",
    "can't",
    "it's",
    "they're",
    "we're",
    "isn't",
    "aren't",
    "doesn't",
    "didn't",
    "wouldn't",
    "couldn't",
    "shouldn't",
    "I'm",
    "I've",
    "I'll",
    "that's",
    "there's",
    "here's",
    "what's",
  ];
  const contractionCount = contractions.reduce(
    (count, c) => count + (lowerText.split(c).length - 1),
    0
  );
  const contractionRate = contractionCount / words.length;

  // 5. Sentence starter diversity
  const starters = sentences
    .map((s) => s.trim().split(/\s+/)[0]?.toLowerCase())
    .filter(Boolean) as string[];
  const uniqueStarters = new Set(starters);
  const starterDiversity = uniqueStarters.size / starters.length;

  // Score calculation (0 = human, 100 = AI)
  let score = 50; // start neutral

  // Low burstiness = AI (AI writes uniform sentences)
  if (burstiness < 0.3) score += 15;
  else if (burstiness < 0.5) score += 5;
  else if (burstiness > 0.7) score -= 15;
  else if (burstiness > 0.5) score -= 8;

  // High transition density = AI
  if (transitionDensity > 0.3) score += 12;
  else if (transitionDensity > 0.15) score += 5;
  else if (transitionDensity < 0.05) score -= 8;

  // Low contraction rate = AI
  if (contractionRate < 0.005) score += 10;
  else if (contractionRate > 0.02) score -= 12;
  else if (contractionRate > 0.01) score -= 5;

  // Low starter diversity = AI
  if (starterDiversity < 0.5) score += 8;
  else if (starterDiversity > 0.8) score -= 8;

  // Low TTR = AI (repetitive vocabulary)
  if (ttr < 0.4) score += 5;
  else if (ttr > 0.6) score -= 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  const score = detectAI(text);

  return NextResponse.json({
    score,
    label: score < 15 ? "human" : score < 40 ? "mixed" : "ai",
    metrics: {
      wordCount: text.split(/\s+/).filter(Boolean).length,
      sentenceCount: text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
        .length,
    },
  });
}
