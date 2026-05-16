import postgres from "postgres";

const SOURCE_DB = process.env.SOURCE_DB || "postgresql://imajin:qXSzu75yD6PuFJQO51dFdMoMroUBMqqY@localhost:5432/imajin_prod";
const TARGET_DB = process.env.TARGET_DB || "postgresql://imajin_dev:uwbuHZkFh2jJfeuqUk3lI9ENOfMhDNvD@localhost:5432/scorecard_dev";

const source = postgres(SOURCE_DB);
const target = postgres(TARGET_DB);

// Fetch dykil survey
const [survey] = await source`SELECT * FROM dykil.surveys WHERE id = ${"survey_ai_readiness_001"}`;
if (!survey) { console.error("Survey not found"); process.exit(1); }

const fields = survey.fields;
const elements = fields.elements || [];

// Create scorecard
const scorecardId = "sc_ai_readiness_001";
await target`
  INSERT INTO scorecards (id, creator_did, title, description, status, scoring_enabled, total_possible_points, tiers, landing_config, lead_gate_position, require_email, require_phone)
  VALUES (
    ${scorecardId},
    ${survey.did},
    ${survey.title},
    ${"Assess your business readiness for AI adoption. 10 scored questions + 5 qualifying questions."},
    ${"published"},
    ${true},
    ${10},
    ${JSON.stringify([
      { name: "Not Ready", minScore: 0, maxScore: 3, color: "red", label: "Needs Foundation Work" },
      { name: "Getting There", minScore: 4, maxScore: 6, color: "amber", label: "Ready for Quick Wins" },
      { name: "AI Ready", minScore: 7, maxScore: 10, color: "green", label: "Ready to Transform" }
    ])},
    ${JSON.stringify({
      hook: "Is your business actually ready for AI \u2014 or are you about to automate a mess?",
      hookSubtext: "Most businesses skip the readiness check and wonder why AI tools don\u2019t stick. Take 5 minutes to find out where you actually stand.",
      valueProps: [
        { icon: "\ud83c\udfaf", title: "Honest Assessment", description: "10 questions that cut through the hype and tell you what\u2019s real." },
        { icon: "\u26a1", title: "Instant Results", description: "Get your score, your tier, and specific next steps \u2014 not a sales pitch." },
        { icon: "\ud83d\udd12", title: "Your Data Stays Yours", description: "Built on Imajin. No tracking, no selling your info to third parties." }
      ],
      credibility: {
        bio: "Ryan Veteze \u2014 30+ years building systems. Director-level at TripArc (8 teams). Now building sovereign technology at Imajin.",
        stats: "116K lines of production code. 2,200+ commits. 14 years of infrastructure.",
        research: "Based on patterns from hundreds of businesses across consulting, events, and enterprise."
      },
      cta: { label: "Take the Assessment", timeEstimate: "Takes 5 minutes", resultPromise: "Get your score instantly" }
    })},
    ${"after_quiz"},
    ${true},
    ${false}
  )
  ON CONFLICT (id) DO NOTHING
`;
console.log("Scorecard created:", scorecardId);

// Convert elements to questions
let sortOrder = 0;
for (const el of elements) {
  sortOrder++;
  
  let type, options, isQualifying;
  
  if (el.type === "boolean") {
    type = "yes_no";
    options = [
      { value: "true", label: "Yes", points: 1 },
      { value: "false", label: "No", points: 0 }
    ];
    isQualifying = false;
  } else if (el.type === "radiogroup") {
    type = "multiple_choice";
    options = (el.choices || []).map(c => ({
      value: typeof c === "string" ? c : c.value,
      label: typeof c === "string" ? c : c.text,
      points: 0
    }));
    isQualifying = true;
  } else if (el.type === "comment" || el.type === "text") {
    type = "open_text";
    options = [];
    isQualifying = true;
  } else {
    type = "open_text";
    options = [];
    isQualifying = true;
  }

  // Skip contact fields - scorecard handles lead capture separately
  if (["contact_name", "contact_email", "contact_phone"].includes(el.name)) {
    console.log("  Skipping contact field:", el.name, "(handled by lead capture gate)");
    continue;
  }

  const qId = "q_" + el.name;
  await target`
    INSERT INTO questions (id, scorecard_id, text, type, sort_order, is_required, is_qualifying, options)
    VALUES (
      ${qId},
      ${scorecardId},
      ${el.title || el.name},
      ${type},
      ${sortOrder},
      ${el.isRequired !== false},
      ${isQualifying},
      ${JSON.stringify(options)}
    )
    ON CONFLICT (id) DO NOTHING
  `;
  console.log("  Question:", qId, "-", type, isQualifying ? "(qualifying)" : "(scored)");
}

// Create tier results
const tiers = [
  {
    name: "Not Ready",
    bigReveal: "Your business needs foundation work before AI will stick.",
    insights: [
      { title: "Process First", body: "AI amplifies what you have. Without documented processes, you're automating chaos." },
      { title: "Knowledge Gaps", body: "If only one person knows how things work, AI can't learn it either." },
      { title: "Quick Win", body: "Start by documenting your top 3 recurring tasks. That's your AI on-ramp." }
    ],
    nextStepType: "book_call",
    nextStepConfig: { label: "Book a Discovery Call", description: "Let's map your processes and build the foundation.", url: "https://cal.com/veteze" }
  },
  {
    name: "Getting There",
    bigReveal: "You've got the basics \u2014 now it's time to accelerate.",
    insights: [
      { title: "Low-Hanging Fruit", body: "Your documented processes are ready for AI augmentation. Start with the repetitive ones." },
      { title: "Response Time", body: "AI can handle first responses, triage, and routing \u2014 freeing your team for real work." },
      { title: "90-Day Impact", body: "With targeted implementation, you could reclaim 10-15 hours per week within 3 months." }
    ],
    nextStepType: "book_call",
    nextStepConfig: { label: "Book a Strategy Session", description: "We'll identify your highest-ROI automation targets.", url: "https://cal.com/veteze" }
  },
  {
    name: "AI Ready",
    bigReveal: "Your business is ready to transform. Let's build.",
    insights: [
      { title: "Strong Foundation", body: "Documented processes, structured templates, self-serve flows \u2014 you've done the hard part." },
      { title: "Sovereignty Matters", body: "You scored well on vendor independence and data awareness. That's rare and valuable." },
      { title: "What's Next", body: "Custom AI workflows, intelligent routing, and autonomous agents. Your infrastructure supports it." }
    ],
    nextStepType: "book_call",
    nextStepConfig: { label: "Let's Build", description: "Your business is ready for custom AI implementation.", url: "https://cal.com/veteze" }
  }
];

for (const tier of tiers) {
  const trId = "tr_" + tier.name.toLowerCase().replace(/\s+/g, "_");
  await target`
    INSERT INTO tier_results (id, scorecard_id, tier_name, big_reveal, insights, next_step_type, next_step_config)
    VALUES (
      ${trId},
      ${scorecardId},
      ${tier.name},
      ${tier.bigReveal},
      ${JSON.stringify(tier.insights)},
      ${tier.nextStepType},
      ${JSON.stringify(tier.nextStepConfig)}
    )
    ON CONFLICT (id) DO NOTHING
  `;
  console.log("  Tier result:", tier.name);
}

console.log("\nDone! Migrated survey_ai_readiness_001 -> sc_ai_readiness_001");
console.log("View at: https://dev-scorecard.imajin.ai/scorecard/sc_ai_readiness_001");

await source.end();
await target.end();
