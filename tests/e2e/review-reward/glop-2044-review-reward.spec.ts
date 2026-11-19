import { test, expect } from '../fixtures.js';
import type { Page, TestInfo } from '@playwright/test';
import { MemberApi, MISSING_MEMBER, hasMember, type RewardQuote } from './member-api.js';
import { TIERS, eligibleValues, expectedReward, formatPoints, type Tier } from './reward-policy.js';

// GLOP-2044 Review Reward Policy Update: read-only checks on the dev server saved in the ticket.
// Cases: tickets/GLOP-2044/02-cases.csv. Mapping and run results: tickets/GLOP-2044/03-automation.md.
//
// Nothing is written: no review is submitted, no order is placed, the modal is opened and closed.
// The data is the seeded member's existing orders waiting for a review, so which ACs are exercised
// (coupon split, points, shipping, multi-item, min/cap bands) depends on that data and is annotated
// on each run. Write flows (award, upgrade, edit, cancel, refund) are manual cases for now.

test.describe.configure({ timeout: 120_000 });
test.skip(!hasMember(), MISSING_MEMBER);

type Row = {
  orderItemId: number; orderCode: string; product: string; cost: number; couponShare: number;
  pointsOnOrder: number; shippingOnOrder: number; eligibleValue: number;
  expected: Record<Tier, number>; quote: RewardQuote;
};

const note = (testInfo: TestInfo, type: string, description: string) => testInfo.annotations.push({ type, description });
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Reads every waiting line with its order data and reward quote. Cached per worker: it is read-only. */
let snapshot: Promise<Row[]> | undefined;
function loadRows(api: string, storefront: string): Promise<Row[]> {
  snapshot ??= (async () => {
    const member = await MemberApi.signIn(api, storefront);
    try {
      const { items: waiting } = await member.waitingItems();
      const rows: Row[] = [];
      for (const orderId of [...new Set(waiting.map(item => item.order.id))]) {
        const [items, payment] = await Promise.all([member.orderItems(orderId), member.orderPayment(orderId)]);
        const summary = payment.payment_summary;
        const lines = items.order_items.map(line => ({
          orderItemId: line.order_item_id, cost: line.cart_item.updated_cost ?? line.cart_item.cost
        }));
        const values = eligibleValues(lines, summary.coupon_discount);
        for (const item of waiting.filter(w => w.order.id === orderId)) {
          const line = lines.find(l => l.orderItemId === item.order_item_id);
          if (!line) throw new Error(`Order ${orderId} has no line ${item.order_item_id}`);
          const eligibleValue = values.get(line.orderItemId)!;
          rows.push({
            orderItemId: line.orderItemId, orderCode: item.order.code, product: item.order.specs, cost: line.cost,
            couponShare: line.cost - eligibleValue, pointsOnOrder: summary.points_discount, shippingOnOrder: summary.shipping_cost,
            eligibleValue,
            expected: { text: expectedReward(eligibleValue, 'text'), photo: expectedReward(eligibleValue, 'photo') },
            quote: await member.rewardQuote(line.orderItemId)
          });
        }
      }
      return rows;
    } finally {
      await member.dispose();
    }
  })();
  return snapshot;
}

async function rowsFor(apps: { api?: string; storefront?: string }, testInfo: TestInfo): Promise<Row[]> {
  const rows = await loadRows(apps.api!, apps.storefront!);
  test.skip(rows.length === 0, 'The member has no order lines waiting for a review.');
  await testInfo.attach('reward-rows.json', { body: JSON.stringify(rows, null, 2), contentType: 'application/json' });
  return rows;
}

// KNOW-AUTO-002: server-rendered controls are visible before hydration; wait for Nuxt.
async function gotoHydrated(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => (document.getElementById('__nuxt') as any)?.__vue_app__?.$nuxt?.isHydrating === false,
    null, { timeout: 45_000 }
  );
}

test.describe('GLOP-2044 review reward quote (API)', { tag: ['@glop-2044', '@api', '@read-only'] }, () => {
  test('[GLOP-2044-TC-001] each waiting order line is quoted clamp(product value - coupon share) x 5% / 10%', async ({ apps }, testInfo) => {
    const rows = await rowsFor(apps, testInfo);

    for (const row of rows) {
      const label = `${row.orderCode} (item ${row.orderItemId}, value ${row.eligibleValue})`;
      if (row.eligibleValue <= 0) {
        note(testInfo, 'zero-value-line', `${label}: quote ${row.quote.text.points}/${row.quote.photo.points}; expected UI for zero value is unconfirmed (TC-011)`);
        continue;
      }
      for (const tier of ['text', 'photo'] as const) {
        const quoted = row.quote[tier].points;
        const diff = Math.abs(quoted - row.expected[tier]);
        expect.soft(diff, `${label} ${tier}: quoted ${quoted}, expected ${row.expected[tier]}`).toBeLessThanOrEqual(1);
        if (diff > 0 && diff <= 1) note(testInfo, 'rounding (Q1)', `${label} ${tier}: expected ${row.expected[tier]}, quoted ${quoted}`);
      }
    }

    // Which parts of the policy the existing data actually exercised.
    const bands = (tier: Tier) => {
      const { min, max } = TIERS[tier];
      const hit = rows.map(r => r.expected[tier]);
      return `min ${hit.filter(v => v === min).length}, between ${hit.filter(v => v > min && v < max).length}, cap ${hit.filter(v => v === max).length}`;
    };
    // A rule is only proven by a line where breaking it would change the expected reward
    // (a 2,700 line at the 300P minimum says nothing about whether shipping was added).
    const proves = (wrongValue: (r: Row) => number) => rows.filter(r => r.eligibleValue > 0 &&
      (['text', 'photo'] as const).some(t => Math.abs(expectedReward(wrongValue(r), t) - r.expected[t]) > 1)).length;
    note(testInfo, 'coverage', `${rows.length} lines; text bands: ${bands('text')}; photo bands: ${bands('photo')}`);
    note(testInfo, 'coverage', `lines that prove the rule: coupon reduces value ${proves(r => r.cost)} (AC-07/10), ` +
      `points do not reduce it ${proves(r => r.eligibleValue - r.pointsOnOrder * (r.cost / Math.max(r.cost, 1)))} (AC-08), ` +
      `shipping excluded ${proves(r => r.eligibleValue + r.shippingOnOrder)} (AC-09)`);
  });

  test('[GLOP-2044-TC-002] quotes state 5% / max 2,000P for text and 10% / max 5,000P for photo/video, within limits', async ({ apps }, testInfo) => {
    const rows = await rowsFor(apps, testInfo);
    for (const row of rows) {
      for (const tier of ['text', 'photo'] as const) {
        const { rate, min, max } = TIERS[tier];
        const quote = row.quote[tier];
        const label = `${row.orderCode} ${tier}`;
        expect.soft(quote.rate, `${label} rate`).toBe(rate);
        expect.soft(quote.max_points, `${label} max_points`).toBe(max);
        if (row.eligibleValue > 0) {
          expect.soft(quote.points, `${label} at least the minimum`).toBeGreaterThanOrEqual(min);
          expect.soft(quote.points, `${label} at most the cap`).toBeLessThanOrEqual(max);
        }
      }
    }
  });

  test('[GLOP-2044-TC-003] the photo multiplier is photo points / text points to one decimal', async ({ apps }, testInfo) => {
    const rows = await rowsFor(apps, testInfo);
    for (const row of rows.filter(r => r.quote.text.points > 0)) {
      expect.soft(row.quote.multiplier, `${row.orderCode} multiplier`).toBe(round1(row.quote.photo.points / row.quote.text.points));
    }
  });

  test('[GLOP-2044-TC-006] an order line that does not exist gets no reward quote', async ({ apps }) => {
    const member = await MemberApi.signIn(apps.api!, apps.storefront!);
    try {
      const { status, body } = await member.get<{ reward?: RewardQuote } | null>('review/reward/999999999');
      const quoted = status === 200 && body.success === true && Boolean(body.data?.reward);
      expect(quoted, `HTTP ${status}, success=${body.success}, message=${body.message}`).toBe(false);
    } finally {
      await member.dispose();
    }
  });
});

test.describe('GLOP-2044 write-review modal (KR)', { tag: ['@glop-2044', '@ui', '@read-only'] }, () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('[GLOP-2044-TC-004] the modal shows the line\'s text and photo rewards, rates, caps and multiplier', async ({ page, context, apps }, testInfo) => {
    const rows = await rowsFor(apps, testInfo);
    const byId = new Map(rows.map(r => [r.orderItemId, r]));
    const member = await MemberApi.signIn(apps.api!, apps.storefront!);
    await member.shareSessionWith(context);
    await member.dispose();

    await gotoHydrated(page, '/kr/account/reviews');
    const list = page.getByTestId('account-reviews-page').locator('article');
    await expect(list.first()).toBeVisible({ timeout: 30_000 });
    const count = Math.min(3, await list.count());

    for (let i = 0; i < count; i++) {
      const quoteResponse = page.waitForResponse(response => /\/review\/reward\/\d+/.test(response.url()));
      await list.nth(i).getByRole('button', { name: '후기 작성' }).click();
      const response = await quoteResponse;
      const orderItemId = Number(/\/review\/reward\/(\d+)/.exec(response.url())![1]);
      const quote = ((await response.json()) as { data: { reward: RewardQuote } }).data.reward;
      const row = byId.get(orderItemId);

      const dialog = page.getByRole('dialog').filter({ hasText: '후기 작성' });
      await expect(dialog).toBeVisible();
      const textRow = dialog.locator('.reward__row--text');
      const photoRow = dialog.locator('.reward__row--photo');
      await expect(textRow).toContainText('일반 리뷰 작성');
      await expect(textRow).toContainText('5% 적립 · 최대 2,000P');
      await expect(textRow.locator('.reward__points')).toHaveText(formatPoints(quote.text.points));
      await expect(photoRow).toContainText('사진·동영상 리뷰 작성');
      await expect(photoRow).toContainText('10% 적립 · 최대 5,000P');
      await expect(photoRow.locator('.reward__points')).toHaveText(formatPoints(quote.photo.points));
      await expect(photoRow).toContainText(`최대 적립금 ${quote.multiplier}배`);

      // The shown values must also be the policy's values, not just the API's.
      if (row && row.eligibleValue > 0) {
        expect.soft(Math.abs(quote.text.points - row.expected.text), `${row.orderCode} text shown vs policy`).toBeLessThanOrEqual(1);
        expect.soft(Math.abs(quote.photo.points - row.expected.photo), `${row.orderCode} photo shown vs policy`).toBeLessThanOrEqual(1);
      }
      note(testInfo, 'modal', `item ${orderItemId}${row ? ` ${row.orderCode}` : ''}: ${formatPoints(quote.text.points)} / ${formatPoints(quote.photo.points)} x${quote.multiplier}`);

      await dialog.getByRole('button', { name: 'Close' }).click();
      await expect(dialog).toBeHidden();
    }
  });
});
