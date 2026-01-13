/**
 * Utility for platform fee calculations based on subscription tiers.
 */

export const TIER_RATES = {
  'Free': 0.03,          // 3%
  'Professional': 0.025,   // 2.5%
  'Teams': 0.0225         // 2.25%
};

/**
 * Calculates the platform fee for a given amount and tier.
 * Rounding to 2 decimal places ensures consistency with payment gateways.
 */
export const calculatePlatformFee = (amount, tier = 'Free') => {
  if (!amount || amount <= 0) return 0;
  const rate = TIER_RATES[tier] || TIER_RATES['Free'];
  const fee = amount * rate;
  return Math.round((fee + Number.EPSILON) * 100) / 100;
};

/**
 * Calculates the net payout after fee deduction.
 */
export const calculateNetPayout = (amount, tier = 'Free') => {
  const fee = calculatePlatformFee(amount, tier);
  return Math.round((amount - fee + Number.EPSILON) * 100) / 100;
};

/**
 * Unit Test Suite for Fee Logic
 * Verifies all tiers and edge cases.
 */
export const runFeeTests = () => {
  const testCases = [
    { tier: 'Free', amount: 100, expectedFee: 3.00, expectedNet: 97.00 },
    { tier: 'Professional', amount: 100, expectedFee: 2.50, expectedNet: 97.50 },
    { tier: 'Teams', amount: 100, expectedFee: 2.25, expectedNet: 97.75 },
    { tier: 'Free', amount: 59.99, expectedFee: 1.80, expectedNet: 58.19 },
    { tier: 'Teams', amount: 1000, expectedFee: 22.50, expectedNet: 977.50 },
    { tier: 'Free', amount: 0, expectedFee: 0, expectedNet: 0 }
  ];

  return testCases.map(tc => {
    const actualFee = calculatePlatformFee(tc.amount, tc.tier);
    const actualNet = calculateNetPayout(tc.amount, tc.tier);
    return {
      ...tc,
      actualFee,
      actualNet,
      passed: actualFee === tc.expectedFee && actualNet === tc.expectedNet
    };
  });
};