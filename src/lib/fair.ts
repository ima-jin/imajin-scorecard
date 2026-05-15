const PAY_URL = process.env.IMAJIN_PAY_URL || 'https://pay.imajin.ai';

export interface FairManifest {
  type: 'scorecard.completion';
  scorecardId: string;
  creatorDid: string;
  respondentDid?: string;
  attestationId?: string;
  shares: Array<{
    did: string;
    role: string;
    bps: number; // basis points
  }>;
}

export function buildFairManifest(
  scorecardId: string,
  creatorDid: string,
  respondentDid?: string,
  attestationId?: string,
): FairManifest {
  return {
    type: 'scorecard.completion',
    scorecardId,
    creatorDid,
    respondentDid,
    attestationId,
    shares: [
      { did: creatorDid, role: 'creator', bps: 9750 }, // 97.5%
      // Node fee (0.5%) and MJN fee (1%) added by settlement layer
      // Scope fee (0.25%) added if applicable
      // Buyer credit (0.25%) if applicable
    ],
  };
}

export async function recordFairManifest(manifest: FairManifest): Promise<boolean> {
  try {
    const res = await fetch(`${PAY_URL}/api/fair/manifests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(manifest),
    });
    if (!res.ok) {
      console.error('Fair manifest recording failed:', res.status);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Fair manifest error:', err);
    return false;
  }
}
