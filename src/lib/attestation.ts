const REGISTRY_URL = process.env.IMAJIN_REGISTRY_URL || 'https://registry.imajin.ai';
const APP_DID = process.env.IMAJIN_APP_DID;

export interface AssessmentAttestation {
  scorecardId: string;
  scorecardTitle: string;
  totalScore: number;
  totalPossible: number;
  tierName: string;
}

export async function createAssessmentAttestation(
  issuerDid: string, // scorecard creator
  subjectDid: string, // respondent
  assessment: AssessmentAttestation,
  appDid?: string,
): Promise<{ attestationId: string } | null> {
  try {
    const res = await fetch(`${REGISTRY_URL}/api/attestations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(appDid ? { 'X-App-DID': appDid } : {}),
      },
      body: JSON.stringify({
        type: 'assessment.completed',
        issuer: issuerDid,
        subject: subjectDid,
        payload: assessment,
      }),
    });
    if (!res.ok) {
      console.error('Attestation creation failed:', res.status, await res.text());
      return null;
    }
    return (await res.json()) as { attestationId: string };
  } catch (err) {
    console.error('Attestation error:', err);
    return null;
  }
}

// Convenience wrapper that uses the app DID from env
export async function createAssessmentAttestationWithEnvDid(
  issuerDid: string,
  subjectDid: string,
  assessment: AssessmentAttestation,
): Promise<{ attestationId: string } | null> {
  return createAssessmentAttestation(issuerDid, subjectDid, assessment, APP_DID);
}
