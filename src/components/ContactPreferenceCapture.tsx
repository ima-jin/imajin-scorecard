'use client';

import { useState } from 'react';

interface ContactPreferenceCaptureProps {
  scorecardId: string;
  responseId: string;
  tierResult: { nextStepConfig?: Record<string, unknown> | null } | null;
}

export default function ContactPreferenceCapture({
  scorecardId,
  responseId,
  tierResult,
}: ContactPreferenceCaptureProps) {
  const [contactMethod, setContactMethod] = useState<'phone' | 'email'>('email');
  const [contactValue, setContactValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactValue.trim()) return;

    setSubmitting(true);
    setError(null);

    const body: Record<string, string> = {};
    if (contactMethod === 'email') {
      body.email = contactValue.trim();
    } else {
      body.phone = contactValue.trim();
    }

    try {
      const res = await fetch(
        `/api/scorecards/${scorecardId}/responses/${responseId}/capture`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/10 rounded-full mb-4">
          <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-1">Thanks! We'll be in touch.</h3>
        <p className="text-gray-400 text-sm">Someone from our team will reach out to you soon.</p>
      </div>
    );
  }

  const nextStepConfig = (tierResult?.nextStepConfig ?? {}) as {
    description?: string;
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-white mb-2">
          We've got your results. Want us to follow up?
        </h3>
        {nextStepConfig.description && (
          <p className="text-gray-400 text-sm">{nextStepConfig.description}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">How should we reach you?</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setContactMethod('email'); setContactValue(''); }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                contactMethod === 'email'
                  ? 'bg-amber-500 text-black border-amber-500'
                  : 'bg-gray-800 text-white border-gray-700 hover:border-gray-600'
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => { setContactMethod('phone'); setContactValue(''); }}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                contactMethod === 'phone'
                  ? 'bg-amber-500 text-black border-amber-500'
                  : 'bg-gray-800 text-white border-gray-700 hover:border-gray-600'
              }`}
            >
              Phone
            </button>
          </div>
        </div>

        <div>
          <input
            type={contactMethod === 'email' ? 'email' : 'tel'}
            value={contactValue}
            onChange={(e) => setContactValue(e.target.value)}
            placeholder={contactMethod === 'email' ? 'you@example.com' : '(555) 123-4567'}
            required
            className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !contactValue.trim()}
          className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-700 disabled:cursor-not-allowed text-black font-medium rounded-lg px-6 py-3 transition-colors"
        >
          {submitting ? 'Submitting…' : 'Yes, reach out →'}
        </button>
      </form>
    </div>
  );
}
