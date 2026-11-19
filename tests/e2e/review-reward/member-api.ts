import { request, type APIRequestContext, type BrowserContext } from '@playwright/test';

// Signs the seeded dev member in through the API (not the form) and exposes the member endpoints
// GLOP-2044 reads. Credentials come only from the ignored multi-agents/.env:
//   QA_MEMBER_EMAIL / QA_MEMBER_PASSWORD   (falls back to AUTH_TEST_EMAIL / AUTH_TEST_PASSWORD)
//   QA_DEV_ORIGIN_KEY                      (optional dev WAF key; falls back to DEV_INTERNAL_ORIGIN_KEY)
// The account must exist on the server under test: each dev server has its own users.

const memberEmail = () => process.env.QA_MEMBER_EMAIL || process.env.AUTH_TEST_EMAIL || '';
const memberPassword = () => process.env.QA_MEMBER_PASSWORD || process.env.AUTH_TEST_PASSWORD || '';
const originKey = () => process.env.QA_DEV_ORIGIN_KEY || process.env.DEV_INTERNAL_ORIGIN_KEY || '';

export const MISSING_MEMBER = 'Set QA_MEMBER_EMAIL and QA_MEMBER_PASSWORD in multi-agents/.env (a dev-server member).';
export const hasMember = () => Boolean(memberEmail() && memberPassword());

type Envelope<T> = { success: boolean; message?: string; data: T; meta?: Record<string, unknown> | null };

export type QueueItem = { order_item_id: number; order: { id: number; code: string; product: string; specs: string } };
export type QueueOrder = { order_id: number; items: QueueItem[] };
export type RewardQuote = {
  text: { points: number; rate: number; max_points: number };
  photo: { points: number; rate: number; max_points: number };
  multiplier: number;
};
export type OrderItems = {
  id: number; currency_code: string;
  order_items: { order_item_id: number; cart_item: { product: string; cost: number; updated_cost: number | null; quantity: number } }[];
};
export type OrderPayment = {
  order_number: string;
  payment_summary: {
    currency_code: string; subtotal_cost: number; shipping_cost: number; coupon_discount: number;
    points_discount: number; additional_charge: number; total_cost: number;
  };
};

export class MemberApi {
  private constructor(readonly context: APIRequestContext, private readonly prefix: string) {}

  /** apiOrigin is the ticket's saved API server, e.g. https://shared-dev-static-api.musticker.com/ */
  static async signIn(apiOrigin: string, storefront: string): Promise<MemberApi> {
    const sf = new URL(storefront).origin;
    const key = originKey();
    const context = await request.newContext({
      extraHTTPHeaders: { origin: sf, referer: `${sf}/kr/auth/login`, accept: 'application/json', ...(key ? { 'x-internal-origin': key } : {}) }
    });
    const prefix = new URL('index.php/sys/kr/', apiOrigin).href;
    const response = await context.post(`${prefix}auth/login`, {
      data: { email: memberEmail(), password: memberPassword(), remember_me: true }
    });
    // A refused login is HTTP 200 with success:false, so check the body too.
    const body = await response.json() as Envelope<unknown>;
    if (response.status() !== 200 || body.success !== true) {
      await context.dispose();
      throw new Error(`Member sign-in failed on ${prefix}: HTTP ${response.status()}, ${body.message ?? 'no message'}`);
    }
    return new MemberApi(context, prefix);
  }

  async get<T>(path: string, params?: Record<string, string | number>): Promise<{ status: number; body: Envelope<T> }> {
    const response = await this.context.get(`${this.prefix}${path}`, { params });
    return { status: response.status(), body: await response.json().catch(() => ({ success: false, data: null })) as Envelope<T> };
  }

  private async data<T>(path: string, params?: Record<string, string | number>): Promise<T> {
    const { status, body } = await this.get<T>(path, params);
    if (status !== 200 || !body.success) throw new Error(`GET ${path} -> HTTP ${status}, success=${body.success}, ${body.message ?? ''}`);
    return body.data;
  }

  /**
   * Every order line waiting for a review. review/queue returns the whole list in one response and
   * ignores page/limit parameters (checked on dev-1 2026-11-11; the storefront pages it client-side).
   * Its meta.total_items (15) and review/stats pending_count (19) did not match the 11 lines listed: OBS-02.
   */
  async waitingItems(): Promise<{ items: QueueItem[]; totalItems: number }> {
    const { status, body } = await this.get<{ items: QueueOrder[] }>('review/queue');
    if (status !== 200 || !body.success) throw new Error(`review/queue -> HTTP ${status}`);
    const lines = (body.data.items ?? []).flatMap(order => order.items);
    const unique = [...new Map(lines.map(line => [line.order_item_id, line])).values()];
    return { items: unique, totalItems: Number(body.meta?.total_items ?? 0) };
  }

  rewardQuote(orderItemId: number) { return this.data<{ reward: RewardQuote }>(`review/reward/${orderItemId}`).then(d => d.reward); }
  orderItems(orderId: number) { return this.data<OrderItems>(`orders/detail/${orderId}/items`); }
  orderPayment(orderId: number) { return this.data<OrderPayment>(`orders/detail/${orderId}/payment`); }

  /** Copies the member session cookie into a browser context (the fixture's production guard stays on). */
  async shareSessionWith(browserContext: BrowserContext): Promise<void> {
    await browserContext.addCookies((await this.context.storageState()).cookies);
    const key = originKey();
    if (key) {
      await browserContext.route(url => /^shared-dev-static-[a-z0-9-]+\.musticker\.com$/.test(url.hostname),
        route => route.continue({ headers: { ...route.request().headers(), 'x-internal-origin': key } }));
    }
  }

  dispose() { return this.context.dispose(); }
}
