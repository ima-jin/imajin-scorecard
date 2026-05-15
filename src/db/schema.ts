import { pgTable, text, timestamp, jsonb, integer, boolean, index } from 'drizzle-orm/pg-core';

// Scorecards — the quiz/assessment definitions
export const scorecards = pgTable('scorecards', {
  id: text('id').primaryKey(),                                // sc_xxx
  creatorDid: text('creator_did').notNull(),                 // Owner DID
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('draft'),          // draft, published, closed
  
  // Scoring config
  scoringEnabled: boolean('scoring_enabled').notNull().default(true),
  totalPossiblePoints: integer('total_possible_points'),
  tiers: jsonb('tiers').notNull().default([]),                // [{ name, minScore, maxScore, color, label }]
  
  // Landing page config
  landingConfig: jsonb('landing_config').default({}),         // { hook, valueProps, credibility, cta }
  
  // Lead capture config
  leadGatePosition: text('lead_gate_position').notNull().default('after_quiz'), // before_quiz, after_quiz
  requireEmail: boolean('require_email').notNull().default(true),
  requirePhone: boolean('require_phone').notNull().default(false),
  
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  creatorIdx: index('idx_scorecards_creator').on(table.creatorDid),
  statusIdx: index('idx_scorecards_status').on(table.status),
}));

// Questions — individual questions within a scorecard
export const questions = pgTable('questions', {
  id: text('id').primaryKey(),                                // q_xxx
  scorecardId: text('scorecard_id').references(() => scorecards.id, { onDelete: 'cascade' }).notNull(),
  text: text('text').notNull(),
  type: text('type').notNull(),                               // yes_no, multiple_choice, open_text
  sortOrder: integer('sort_order').notNull().default(0),
  isRequired: boolean('is_required').notNull().default(true),
  isQualifying: boolean('is_qualifying').notNull().default(false), // qualifying = unscored, for lead qualification
  options: jsonb('options').notNull().default([]),             // [{ value, label, points }]
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  scorecardIdx: index('idx_questions_scorecard').on(table.scorecardId),
  sortIdx: index('idx_questions_sort').on(table.scorecardId, table.sortOrder),
}));

// Responses — completed quiz submissions
export const responses = pgTable('responses', {
  id: text('id').primaryKey(),                                // resp_xxx
  scorecardId: text('scorecard_id').references(() => scorecards.id, { onDelete: 'cascade' }).notNull(),
  respondentDid: text('respondent_did'),                      // null until lead capture
  
  // Lead info (captured at gate)
  name: text('name'),
  email: text('email'),
  phone: text('phone'),
  
  // Results
  answers: jsonb('answers').notNull(),                        // [{ questionId, value, points }]
  totalScore: integer('total_score'),
  tierName: text('tier_name'),
  
  // Results page config (per-tier content, resolved at completion)
  resultsConfig: jsonb('results_config').default({}),         // { bigReveal, insights, nextSteps }
  
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  scorecardIdx: index('idx_responses_scorecard').on(table.scorecardId),
  respondentIdx: index('idx_responses_respondent').on(table.respondentDid),
  emailIdx: index('idx_responses_email').on(table.email),
  completedIdx: index('idx_responses_completed').on(table.completedAt),
}));

// Tier results config — per-tier content for results pages
export const tierResults = pgTable('tier_results', {
  id: text('id').primaryKey(),                                // tr_xxx
  scorecardId: text('scorecard_id').references(() => scorecards.id, { onDelete: 'cascade' }).notNull(),
  tierName: text('tier_name').notNull(),
  bigReveal: text('big_reveal'),                              // Overall result headline
  insights: jsonb('insights').default([]),                     // [{ title, body }]
  nextStepType: text('next_step_type'),                       // book_call, event, resource, content
  nextStepConfig: jsonb('next_step_config').default({}),      // { url, label, description }
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  scorecardTierIdx: index('idx_tier_results_scorecard').on(table.scorecardId, table.tierName),
}));

// Types
export type Scorecard = typeof scorecards.$inferSelect;
export type NewScorecard = typeof scorecards.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type Response = typeof responses.$inferSelect;
export type NewResponse = typeof responses.$inferInsert;
export type TierResult = typeof tierResults.$inferSelect;
export type NewTierResult = typeof tierResults.$inferInsert;
