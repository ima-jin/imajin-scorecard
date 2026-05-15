import nodemailer from 'nodemailer';
import type { Response, Scorecard, TierResult } from '@/db/schema';

const POSTAL_HOST = process.env.POSTAL_HOST || 'postal.imajin.ai';
const POSTAL_PORT = parseInt(process.env.POSTAL_PORT || '25');
const POSTAL_FROM = process.env.POSTAL_FROM || 'scorecard@imajin.ai';
const POSTAL_API_KEY = process.env.POSTAL_API_KEY;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://scorecard.imajin.ai';

const transporter = nodemailer.createTransport({
  host: POSTAL_HOST,
  port: POSTAL_PORT,
  secure: POSTAL_PORT === 465,
  auth: POSTAL_API_KEY
    ? { user: 'api', pass: POSTAL_API_KEY }
    : undefined,
  tls: {
    rejectUnauthorized: false,
  },
});

function tierColorToHex(color?: string | null): string {
  switch (color) {
    case 'green': return '#22c55e';
    case 'red': return '#ef4444';
    case 'blue': return '#3b82f6';
    case 'purple': return '#a855f7';
    case 'amber': return '#f59e0b';
    default: return '#f59e0b';
  }
}

function findTierColor(scorecard: Scorecard, tierName: string | null): string {
  if (!tierName) return '#f59e0b';
  const tiers = (scorecard.tiers ?? []) as Array<{ name: string; color?: string }>;
  const tier = tiers.find((t) => t.name === tierName);
  return tierColorToHex(tier?.color);
}

export async function sendResultsEmail(
  response: Response,
  scorecard: Scorecard,
  tierResult: TierResult | null,
): Promise<void> {
  if (!response.email) {
    console.error('sendResultsEmail: no email on response');
    return;
  }

  const totalScore = response.totalScore ?? 0;
  const totalPossible = scorecard.totalPossiblePoints ?? 100;
  const tierName = response.tierName ?? 'Result';
  const tierColor = findTierColor(scorecard, response.tierName);

  const insights = (tierResult?.insights ?? []) as Array<{ title: string; body: string }>;
  const nextStepConfig = (tierResult?.nextStepConfig ?? {}) as {
    url?: string;
    label?: string;
    description?: string;
  };

  const insightsHtml = insights.length
    ? insights
        .map(
          (i) => `
      <div style="background: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 16px; margin-bottom: 12px;">
        <h4 style="color: #f59e0b; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">${escapeHtml(i.title)}</h4>
        <p style="color: #d1d5db; font-size: 13px; line-height: 1.6; margin: 0;">${escapeHtml(i.body)}</p>
      </div>`
        )
        .join('')
    : '';

  const ctaHtml = nextStepConfig.url
    ? `
    <div style="text-align: center; margin: 24px 0;">
      ${nextStepConfig.description ? `<p style="color: #9ca3af; font-size: 13px; margin-bottom: 12px;">${escapeHtml(nextStepConfig.description)}</p>` : ''}
      <a href="${escapeHtml(nextStepConfig.url)}" style="display: inline-block; background: #f59e0b; color: #000; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 8px; text-decoration: none;">${escapeHtml(nextStepConfig.label || 'Take the Next Step')}</a>
    </div>`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your ${escapeHtml(scorecard.title)} Results</title>
</head>
<body style="margin: 0; padding: 0; background: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #030712;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table width="100%" max-width="480" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; width: 100%;">
          <tr>
            <td style="background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px;">
              <!-- Header -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 28px; font-weight: 800; color: #ffffff;">${totalScore}<span style="font-size: 16px; color: #6b7280; font-weight: 500;"> / ${totalPossible}</span></div>
                <div style="margin-top: 8px; display: inline-block; padding: 6px 16px; border-radius: 999px; font-size: 13px; font-weight: 600; background: ${tierColor}22; color: ${tierColor}; border: 1px solid ${tierColor}66;">${escapeHtml(tierName)}</div>
              </div>

              <!-- Big Reveal -->
              ${tierResult?.bigReveal ? `<div style="background: #0b0f19; border: 1px solid #1f2937; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;"><h2 style="color: #ffffff; font-size: 18px; font-weight: 600; margin: 0;">${escapeHtml(tierResult.bigReveal)}</h2></div>` : ''}

              <!-- Insights -->
              ${insightsHtml ? `<div style="margin-bottom: 24px;"><h3 style="color: #ffffff; font-size: 15px; font-weight: 600; margin: 0 0 12px 0;">Your Insights</h3>${insightsHtml}</div>` : ''}

              <!-- CTA -->
              ${ctaHtml}

              <!-- Divider -->
              <div style="border-top: 1px solid #1f2937; margin: 24px 0;"></div>

              <!-- Footer -->
              <div style="text-align: center;">
                <p style="color: #6b7280; font-size: 11px; margin: 0;">
                  Powered by <a href="https://imajin.ai" style="color: #f59e0b; text-decoration: none;">ScoreCard on Imajin</a>
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"ScoreCard" <${POSTAL_FROM}>`,
    to: response.email,
    subject: `Your ${scorecard.title} Results`,
    html,
  });
}

export async function sendLeadNotification(
  response: Response,
  scorecard: Scorecard,
  creatorEmail?: string,
): Promise<void> {
  if (!creatorEmail) {
    return;
  }

  const totalScore = response.totalScore ?? 0;
  const tierName = response.tierName ?? '—';

  // Qualifying answers summary
  const answers = (response.answers ?? []) as Array<{ questionId: string; value: string; points: number }>;
  const qualifyingSummary = answers
    .filter((a) => a.points === 0) // qualifying questions have 0 points
    .map((a) => `<li style="color: #d1d5db; font-size: 13px; margin-bottom: 4px;">${escapeHtml(a.value)}</li>`)
    .join('');

  const qualifyingHtml = qualifyingSummary
    ? `<div style="margin: 16px 0;"><h4 style="color: #f59e0b; font-size: 13px; font-weight: 600; margin: 0 0 8px 0;">Qualifying Answers</h4><ul style="padding-left: 18px; margin: 0;">${qualifyingSummary}</ul></div>`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Lead on ${escapeHtml(scorecard.title)}</title>
</head>
<body style="margin: 0; padding: 0; background: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #030712;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table width="100%" max-width="480" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; width: 100%;">
          <tr>
            <td style="background: #111827; border: 1px solid #1f2937; border-radius: 16px; padding: 32px;">
              <h2 style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 0 0 20px 0;">New Lead</h2>

              <div style="margin-bottom: 16px;">
                <div style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Scorecard</div>
                <div style="color: #ffffff; font-size: 15px; font-weight: 600;">${escapeHtml(scorecard.title)}</div>
              </div>

              <div style="margin-bottom: 16px;">
                <div style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Respondent</div>
                <div style="color: #ffffff; font-size: 15px; font-weight: 600;">${escapeHtml(response.name ?? 'Anonymous')}</div>
                <div style="color: #9ca3af; font-size: 13px;">${escapeHtml(response.email ?? '—')}</div>
                ${response.phone ? `<div style="color: #9ca3af; font-size: 13px;">${escapeHtml(response.phone)}</div>` : ''}
              </div>

              <div style="margin-bottom: 16px;">
                <div style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Score</div>
                <div style="color: #f59e0b; font-size: 20px; font-weight: 800;">${totalScore} <span style="color: #6b7280; font-size: 13px; font-weight: 500;">/ ${scorecard.totalPossiblePoints ?? 100}</span></div>
                <div style="color: #9ca3af; font-size: 13px; margin-top: 2px;">Tier: ${escapeHtml(tierName)}</div>
              </div>

              ${qualifyingHtml}

              <div style="text-align: center; margin: 24px 0 0 0;">
                <a href="${APP_URL}/dashboard/${scorecard.id}" style="display: inline-block; background: #f59e0b; color: #000; font-weight: 600; font-size: 14px; padding: 12px 28px; border-radius: 8px; text-decoration: none;">View in Dashboard</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"ScoreCard" <${POSTAL_FROM}>`,
    to: creatorEmail,
    subject: `New Lead: ${response.name ?? 'Someone'} scored ${totalScore} on ${scorecard.title}`,
    html,
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
