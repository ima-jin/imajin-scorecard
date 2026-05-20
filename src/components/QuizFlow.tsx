'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Option {
  value: string;
  label: string;
  points?: number;
}

interface Question {
  id: string;
  text: string;
  type: string;
  options: Option[];
  isRequired: boolean;
  isQualifying: boolean;
}

interface Scorecard {
  id: string;
  title: string;
  leadGatePosition: string;
}

interface QuizFlowProps {
  scorecard: Scorecard;
  questions: Question[];
}

export default function QuizFlow({ scorecard, questions }: QuizFlowProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  const handleAnswer = useCallback((questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);

  const canProceed = () => {
    if (!currentQuestion) return false;
    if (!currentQuestion.isRequired) return true;
    const val = answers[currentQuestion.id];
    return val !== undefined && val.trim() !== '';
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const answersArray = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value,
      }));

      const res = await fetch(`/api/scorecards/${scorecard.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answersArray }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }

      const data = await res.json();
      router.push(`/scorecard/${scorecard.id}/results/${data.responseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="text-center py-12 text-gray-400">
        No questions in this scorecard.
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span className="text-sm text-amber-400 font-medium">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-medium text-white mb-6">
          {currentQuestion.text}
          {currentQuestion.isRequired && (
            <span className="text-amber-500 ml-1">*</span>
          )}
        </h2>

        {currentQuestion.type === 'yes_no' && (
          <div className="flex gap-4">
            {(currentQuestion.options ?? []).map((opt: Option) => (
              <button
                key={opt.value}
                onClick={() => handleAnswer(currentQuestion.id, opt.value)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors border ${
                  answers[currentQuestion.id] === opt.value
                    ? 'bg-amber-500 text-black border-amber-500'
                    : 'bg-gray-800 text-white border-gray-700 hover:border-gray-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {currentQuestion.type === 'multiple_choice' && (
          <div className="space-y-3">
            {(currentQuestion.options ?? []).map((opt: Option) => (
              <label
                key={opt.value}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  answers[currentQuestion.id] === opt.value
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={opt.value}
                  checked={answers[currentQuestion.id] === opt.value}
                  onChange={() => handleAnswer(currentQuestion.id, opt.value)}
                  className="w-4 h-4 text-amber-500 border-gray-600 focus:ring-amber-500"
                />
                <span className="text-white">{opt.label}</span>
              </label>
            ))}
          </div>
        )}

        {currentQuestion.type === 'open_text' && (
          <textarea
            value={answers[currentQuestion.id] ?? ''}
            onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
            placeholder="Type your answer..."
            rows={4}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="px-4 py-2 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        {currentIndex < totalQuestions - 1 ? (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-black font-medium rounded-lg px-6 py-2 transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceed() || submitting}
            className="bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-black font-medium rounded-lg px-6 py-2 transition-colors"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        )}
      </div>
    </div>
  );
}
