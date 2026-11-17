import { db } from '@/lib/db';

export interface DetectedIntentResult {
  intentName: string;
  confidence: number;
  source: 'RULE_HEURISTIC' | 'TENANT_INTENT' | 'DEFAULT_INTENT';
  actionType: string;
  department?: 'SALES' | 'SUPPORT' | 'BILLING' | 'TECHNICAL';
  priority: number;
  isEscalation: boolean;
}

export const CANONICAL_INTENTS: Record<string, {
  keywords: RegExp;
  confidence: number;
  actionType: string;
  department?: 'SALES' | 'SUPPORT' | 'BILLING' | 'TECHNICAL';
  priority: number;
  isEscalation: boolean;
}> = {
  HUMAN_AGENT_REQUEST: {
    keywords: /(human|agent|representative|executive|operator|person|talk\s+to\s+(a\s+)?person|real\s+person|customer\s+care|kisi\s+se\s+baat|staff\s+se\s+baat|insan\s+se|connect\s+karo|call\s+me|baat\s+karwao|ai\s+se\s+nahi|human\s+chahiye|manager)/i,
    confidence: 0.98,
    actionType: 'HUMAN_HANDOFF',
    department: 'SUPPORT',
    priority: 100,
    isEscalation: true,
  },
  COMPLAINT: {
    keywords: /(complaint|shikayat|worst\s+service|ghatiya|bekar|fraud|cheat|scam|kharab|disappointed|terrible|pathetic|horrible|rude|damage|loot|not\s+working|pareshan|problem\s+hai)/i,
    confidence: 0.95,
    actionType: 'HUMAN_HANDOFF',
    department: 'SUPPORT',
    priority: 90,
    isEscalation: true,
  },
  REFUND_QUERY: {
    keywords: /(refund|money\s+back|paise\s+wapas|return\s+payment|paise\s+lautao|refund\s+kab\s+aayega)/i,
    confidence: 0.94,
    actionType: 'HUMAN_HANDOFF',
    department: 'BILLING',
    priority: 85,
    isEscalation: true,
  },
  PAYMENT_QUERY: {
    keywords: /(payment|paise\s+kat\s+gaye|paid|upi|qr\s+code|google\s+pay|phonepe|paytm|bill|invoice|receipt|double\s+deduct|unpaid|transaction)/i,
    confidence: 0.90,
    actionType: 'AI_ORCHESTRATE',
    department: 'BILLING',
    priority: 70,
    isEscalation: false,
  },
  CANCEL_BOOKING: {
    keywords: /(cancel|cancellation|booking\s+cancel|appointment\s+cancel|nahi\s+karwana|cancel\s+kardo|cancel\s+karna\s+hai)/i,
    confidence: 0.92,
    actionType: 'HUMAN_HANDOFF',
    department: 'SUPPORT',
    priority: 80,
    isEscalation: true,
  },
  RESCHEDULE_BOOKING: {
    keywords: /(reschedule|postpone|time\s+change|date\s+change|kal\s+ke\s+badle|shift\s+karna|timing\s+badal)/i,
    confidence: 0.88,
    actionType: 'AI_ORCHESTRATE',
    department: 'SUPPORT',
    priority: 65,
    isEscalation: false,
  },
  BOOKING_STATUS: {
    keywords: /(booking\s+status|appointment\s+status|kab\s+aayegi|beautician\s+aayi\s+nahi|where\s+is\s+my\s+booking|booking\s+check|track\s+booking)/i,
    confidence: 0.91,
    actionType: 'AI_ORCHESTRATE',
    department: 'SUPPORT',
    priority: 65,
    isEscalation: false,
  },
  BOOKING_REQUEST: {
    keywords: /(book\s+karna\s+hai|book\s+kardo|book\s+now|book\s+this|appointment\s+chahiye|slot\s+book|kal\s+bhejo|aaj\s+bhejo|booking\s+karni\s+hai|book\s+it|schedule\s+karo)/i,
    confidence: 0.93,
    actionType: 'AI_ORCHESTRATE',
    department: 'SALES',
    priority: 60,
    isEscalation: false,
  },
  PACKAGE_COMPARISON: {
    keywords: /(compare|difference|kisme\s+kya\s+hai|better\s+kaunsa|glam\s+vs|rice\s+wax\s+vs|dono\s+me\s+fark)/i,
    confidence: 0.86,
    actionType: 'AI_ORCHESTRATE',
    department: 'SALES',
    priority: 55,
    isEscalation: false,
  },
  PACKAGE_QUERY: {
    keywords: /(package|packages|pkg|rice\s+wax|glam\s+special|golden\s+glow|patel\s+glow|super\s+saver|divine\s+glow|elite\s+glow|soft\s+glam|wax\s+ka\s+package|facial\s+package|packages\s+dikhao|packages\s+btao|options\s+batao|rate\s+list)/i,
    confidence: 0.90,
    actionType: 'AI_ORCHESTRATE',
    department: 'SALES',
    priority: 50,
    isEscalation: false,
  },
  PRICE_QUERY: {
    keywords: /(price|pricing|cost|kitne\s+ka\s+hai|charges|kitna\s+charge|rate\s+kya\s+hai|fees|discount|offer)/i,
    confidence: 0.88,
    actionType: 'AI_ORCHESTRATE',
    department: 'SALES',
    priority: 50,
    isEscalation: false,
  },
  SERVICE_QUERY: {
    keywords: /(service|services|waxing|facial|bleach|cleanup|threading|d-tan|dtan|manicure|pedicure|hair\s+spa|bridal|at\s+home|salon\s+at\s+home|ghar\s+pe\s+salon|kya\s+kya\s+karte\s+ho)/i,
    confidence: 0.87,
    actionType: 'AI_ORCHESTRATE',
    department: 'SALES',
    priority: 45,
    isEscalation: false,
  },
  ADDRESS_QUERY: {
    keywords: /(lucknow|gomti\s+nagar|alambagh|indira\s+nagar|hazratganj|mahanagar|location|city|address|area|kaha\s+operate|kaha\s+service\s+dete|service\s+area|where\s+do\s+you\s+provide)/i,
    confidence: 0.89,
    actionType: 'AI_ORCHESTRATE',
    department: 'SALES',
    priority: 45,
    isEscalation: false,
  },
  APP_DOWNLOAD: {
    keywords: /(app|download|play\s+store|app\s+store|ios\s+app|android\s+app|link\s+bhejo)/i,
    confidence: 0.92,
    actionType: 'AI_ORCHESTRATE',
    department: 'SUPPORT',
    priority: 40,
    isEscalation: false,
  },
  GREETING: {
    keywords: /^(hi|hello|hey|namaste|hlo|good\s+(morning|afternoon|evening)|pranam|kaise\s+ho|salam)[.!?\s]*$/i,
    confidence: 0.99,
    actionType: 'AI_ORCHESTRATE',
    department: 'SALES',
    priority: 20,
    isEscalation: false,
  },
  GENERAL_QUERY: {
    keywords: /(hello\s+mam|who\s+are\s+you|about\s+you|company|contact\s+number|helpline|timing|working\s+hours)/i,
    confidence: 0.80,
    actionType: 'AI_ORCHESTRATE',
    department: 'SUPPORT',
    priority: 30,
    isEscalation: false,
  },
};

export const DEFAULT_INTENTS = CANONICAL_INTENTS;

export class IntentEngine {
  /**
   * Deterministically detect matching intent from user message,
   * combining high-precision regex heuristics, tenant database intents, and fallback classification.
   */
  static async detectIntent(
    companyId: string,
    messageText: string
  ): Promise<DetectedIntentResult> {
    const text = (messageText || '').trim();
    if (!text) {
      return {
        intentName: 'UNKNOWN',
        confidence: 0.1,
        source: 'RULE_HEURISTIC',
        actionType: 'AI_RESPONSE',
        priority: 0,
        isEscalation: false,
      };
    }

    // 1. Check custom tenant intents from database first
    const customIntents = await db.aiIntent.findMany({
      where: { companyId, isEnabled: true },
      orderBy: { priority: 'desc' },
    }).catch(() => []);

    for (const ci of customIntents) {
      try {
        const samples: string[] = JSON.parse(ci.exampleUtterancesJson || '[]');
        const lower = text.toLowerCase();
        const matched = samples.some(s => lower.includes(s.toLowerCase().trim()));
        if (matched) {
          return {
            intentName: ci.name,
            confidence: 0.92,
            source: 'TENANT_INTENT',
            actionType: ci.actionType,
            priority: ci.priority,
            isEscalation: ci.actionType === 'HUMAN_HANDOFF',
          };
        }
      } catch {}
    }

    // 2. Match canonical intents by priority
    for (const [intentName, spec] of Object.entries(CANONICAL_INTENTS)) {
      if (spec.keywords.test(text)) {
        return {
          intentName,
          confidence: spec.confidence,
          source: 'RULE_HEURISTIC',
          actionType: spec.actionType,
          department: spec.department,
          priority: spec.priority,
          isEscalation: spec.isEscalation,
        };
      }
    }

    // 3. Fallback: UNKNOWN intent
    return {
      intentName: 'UNKNOWN',
      confidence: 0.45,
      source: 'RULE_HEURISTIC',
      actionType: 'AI_ORCHESTRATE',
      priority: 0,
      isEscalation: false,
    };
  }
}
