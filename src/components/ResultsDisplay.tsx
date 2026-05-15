'use client';

import Link from 'next/link';

interface Insight {
  title: string;
  body: string;
}

interface TierResult {
  bigReveal: string | null;
  insights: Insight[];
  nextStepType: string | null;
  nextStepConfig: Record<string, unknown> | null;
}

interface ResponseData {
  totalScore: number | null;
  tierName: string | null;
  answers: Array<{ questionId: string; value: string; points: number }>;
}

interface Scorecard {
  id: string;
  title: string;
  totalPossiblePoints: number | null;
  tiers: Array<{ name: string; color?: string; label?: string }>;
}

interface ResultsDisplayProps {
  response: ResponseData;
  scorecard: Scorecard;
  tierResult: TierResult | null;
}

function getTierColor(scorecard: Scorecard, tierName: string | null): string {
  if (!tierName) return '#f59e0b';
  const tier = scorecard.tiers?.find((t) => t.name === tierName);
  return tier?.color || '#f59e0b';
}

function getTierLabel(scorecard: Scorecard, tierName: string | null): string {
  if (!tierName) return 'Result';
  const tier = scorecard.tiers?.find((t) => t.name === tierName);
  return tier?.label || tierName;
}

function getNextStepStyles(type: string | null): string {
  switch (type) {
    case 'book_call':
      return 'bg-amber-500 hover:bg-amber-600 text-black';
    case 'event':
      return 'bg-blue-500 hover:bg-blue-600 text-white';
    case 'resource':
      return 'bg-emerald-500 hover:bg-emerald-600 text-white';
    case 'content':
      return 'bg-gray-600 hover:bg-gray-500 text-white';
    default:
      return 'bg-amber-500 hover:bg-amber-600 text-black';
  }
}

export default function ResultsDisplay({ response, scorecard, tierResult }: ResultsDisplayProps) {
  const totalScore = response.totalScore ?? 0;
  const totalPossible = scorecard.totalPossiblePoints ?? 100;
  const tierName = response.tierName;
  const tierColor = getTierColor(scorecard, tierName);
  const tierLabel = getTierLabel(scorecard, tierName);
  const percentage = Math.min(100, Math.max(0, (totalScore / totalPossible) * 100));

  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const nextStepConfig = (tierResult?.nextStepConfig ?? {}) as {
    url?: string;
    label?: string;
    description?: string;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Score Ring */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke="#1f2937"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r="52"
              fill="none"
              stroke={tierColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-white">{totalScore}</span>
            <span className="text-sm text-gray-400">/ {totalPossible}</span>
          </div>
        </div>

        {/* Tier Badge */}
        <div
          className="mt-4 px-4 py-1.5 rounded-full text-sm font-medium"
          style={{ backgroundColor: `${tierColor}20`, color: tierColor, border: `1px solid ${tierColor}40` }}
        >
          {tierLabel}
        </div>
      </div>

      {/* Big Reveal */}
      {tierResult?.bigReveal && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6 text-center">
          <h2 className="text-xl font-semibold text-white">
            {tierResult.bigReveal}
          </h2>
        </div>
      )}

      {/* Insights */}
      {tierResult?.insights && tierResult.insights.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium text-white mb-4">Your Insights</h3>
          <div className="space-y-4">
            {(tierResult.insights as Insight[]).map((insight, i) => (
              <div
                key={i}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5"
              >
                <h4 className="text-amber-400 font-medium mb-2">{insight.title}</h4>
                <p className="text-gray-300 text-sm leading-relaxed">{insight.body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps CTA */}
      {nextStepConfig.url && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 text-center">
          {nextStepConfig.description && (
            <p className="text-gray-400 text-sm mb-4">{nextStepConfig.description}</p>
          )}
          <a
            href={nextStepConfig.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-block font-medium rounded-lg px-6 py-3 transition-colors ${getNextStepStyles(tierResult?.nextStepType ?? null)}`}
          >
            {nextStepConfig.label || 'Take the Next Step'}
          </a>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 pt-4 border-t border-gray-800">
        Powered by{' '}
        <Link
          href="https://imajin.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-amber-500/80 hover:text-amber-400 transition-colors"
        >
          ScoreCard on Imajin
        </Link>
      </div>
    </div>
  );
}
