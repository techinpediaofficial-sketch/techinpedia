/**
 * Security guardrails & adversarial input detection for AI models
 */

export interface SecurityGuardrailResult {
  isSafe: boolean;
  reason?: 'PROMPT_INJECTION_DETECTED' | 'DATA_LEAKAGE_ATTEMPT' | 'UNSAFE_CONTENT';
}

export function inspectSecurityGuardrails(input: string): SecurityGuardrailResult {
  if (!input) return { isSafe: true };
  const lower = input.toLowerCase();

  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
    /disregard\s+(all\s+)?(previous|prior|system)\s+(instructions|directives)/i,
    /reveal\s+(your\s+)?(system\s+prompt|developer\s+prompt|instructions|initial\s+prompt)/i,
    /show\s+me\s+(your\s+)?(system\s+prompt|rules|hidden\s+instructions)/i,
    /what\s+are\s+your\s+(exact\s+)?instructions/i,
    /repeat\s+(everything|the\s+text)\s+above/i,
    /print\s+(your\s+)?system\s+prompt/i,
    /bypass\s+safety\s+filter/i,
    /you\s+are\s+now\s+in\s+developer\s+mode/i,
    /jailbreak/i,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(lower)) {
      return { isSafe: false, reason: 'PROMPT_INJECTION_DETECTED' };
    }
  }

  const dataLeakPatterns = [
    /show\s+(me\s+)?(another|all|other)\s+customer('s)?\s+(data|details|information|phone|number)/i,
    /list\s+all\s+(users|customers|orders|credit\s+cards|passwords)/i,
    /dump\s+(the\s+)?database/i,
    /reveal\s+internal\s+(api\s+keys|credentials|tokens|passwords)/i,
  ];

  for (const pattern of dataLeakPatterns) {
    if (pattern.test(lower)) {
      return { isSafe: false, reason: 'DATA_LEAKAGE_ATTEMPT' };
    }
  }

  return { isSafe: true };
}
