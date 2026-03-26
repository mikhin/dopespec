export type CreditTierInput = {
  amount: number;
  extraItemId: string;
};

export type CreditTierOutput = {
  credits: number;
};

/** Evaluate rules top-to-bottom, return first match. */
export function evaluateCreditTier(input: CreditTierInput): CreditTierOutput {
  if (input.extraItemId === 'tier_3') return { credits: 5 };
  if (input.extraItemId === 'tier_5') return { credits: 10 };
  if (input.extraItemId === 'tier_12') return { credits: 30 };
  throw new Error('No matching rule for CreditTier');
}
