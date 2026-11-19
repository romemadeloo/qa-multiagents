// GLOP-2044 review reward policy: the test oracle.
// Source: tickets/GLOP-2044/sources/ticket-2026-11-11.md (Jira, updated 2026-11-10).
// Rewards are per eligible product: clamp(eligible value x rate, min, max).

export const TIERS = {
  text: { rate: 5, min: 300, max: 2000 },   // text-only and AI-generated mockup
  photo: { rate: 10, min: 500, max: 5000 }  // actual customer photo and actual video
} as const;

export type Tier = keyof typeof TIERS;

/** Unrounded reward for a tier; the ticket gives no rounding rule (Q1), so callers compare with a 1P tolerance. */
export function expectedReward(eligibleValue: number, tier: Tier): number {
  const { rate, min, max } = TIERS[tier];
  return Math.min(max, Math.max(min, (eligibleValue * rate) / 100));
}

export type OrderLine = { orderItemId: number; cost: number };

/**
 * Eligible value per line: the line's cost minus its proportional share of the order's coupon discount.
 * Redeemed points and shipping are payment/fees and are deliberately ignored (AC-08, AC-09).
 * Assumes the coupon is order-level; a product-specific coupon shows up as a mismatch on the other lines.
 */
export function eligibleValues(lines: OrderLine[], couponDiscount: number): Map<number, number> {
  const subtotal = lines.reduce((sum, line) => sum + line.cost, 0);
  return new Map(lines.map(line => [
    line.orderItemId,
    subtotal > 0 ? line.cost - (couponDiscount * line.cost) / subtotal : 0
  ]));
}

/** Formats points the way the storefront shows them: 2,000P. */
export function formatPoints(points: number): string {
  return `${points.toLocaleString('en-US')}P`;
}
