import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            📊 <span className="text-amber-400">ScoreCard</span>
          </h1>
          <p className="text-xl text-gray-400 mb-2">
            Lead generation & qualification powered by Imajin
          </p>
          <p className="text-gray-500 max-w-xl mx-auto">
            Build scored assessments that generate qualified leads as Imajin DIDs.
            Create quizzes with point values, tiers, and dynamic results — all tied to sovereign identity.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-white mb-2">Scored Quizzes</h3>
            <p className="text-gray-400 text-sm">
              Build assessments with weighted answers, point totals, and automatic tier assignment.
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="text-3xl mb-3">🔐</div>
            <h3 className="text-lg font-semibold text-white mb-2">Sovereign Leads</h3>
            <p className="text-gray-400 text-sm">
              Every respondent is an Imajin DID. No gatekeepers. Own your lead data.
            </p>
          </div>
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="text-3xl mb-3">✨</div>
            <h3 className="text-lg font-semibold text-white mb-2">Dynamic Results</h3>
            <p className="text-gray-400 text-sm">
              Personalized results pages with insights, next steps, and conversion CTAs per tier.
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-amber-500 hover:bg-amber-600 text-gray-950 font-semibold rounded-lg transition-colors"
          >
            Get Started →
          </Link>
        </div>
      </div>
    </main>
  );
}
