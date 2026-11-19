import { test, expect } from '../fixtures.js';
import type { Locator, Page, TestInfo } from '@playwright/test';

// GLOP-1988 footer content update and URL redirection (KR storefront, desktop 1440x900).
// Expected values come from tickets/GLOP-1988/02-cases.csv and sources/ (Figma review,
// redirection guide, dev-1 baseline). Mapping and run results: tickets/GLOP-1988/03-automation.md.
// No form is submitted and no inquiry is sent by this spec; ftc.go.kr is never loaded.

const MIDDLE_DOT_LABELS = ['학교·공공기관 주문', '대량주문·기업 견적', '제휴·파트너십 문의'];
const NEW_PAGES = [
  { label: '학교·공공기관 주문', path: '/kr/institutions', title: '학교·공공기관 스티커 제작 | 견적서·세금계산서 발행, 오늘 제작 내일 발송 – 머스티커', formHeading: '기관 전용 견적 문의' },
  { label: '대량주문·기업 견적', path: '/kr/business', title: '대량주문·기업 견적 | 수량만 알려주시면 당일 견적, 오늘 제작 내일 발송 – 머스티커', formHeading: '기업 견적 문의' },
  { label: '제휴·파트너십 문의', path: '/kr/partnership', title: '제휴·파트너십 문의 – 머스티커', formHeading: '제휴 · 파트너십 문의' },
  { label: '인재채용', path: '/kr/careers', title: '인재채용 – 머스티커', formHeading: '지원하기' }
];
const POLICY_LINKS = [
  { label: '이용약관', path: '/kr/terms-of-use' },
  { label: '개인정보처리방침', path: '/kr/privacy-policy' },
  { label: /오픈소스\s?고지/, path: '/kr/open-source-licenses' }
];
const FTC_URL = 'https://www.ftc.go.kr/bizCommPop.do?wrkr_no=8778803313';
const PRODUCTION_HOSTS = ['musticker.com', 'www.musticker.com', 'api.musticker.com', 'admin-panel.musticker.com'];
const EXPECTED_THIRD_PARTY_HOSTS = ['pf.kakao.com', 'talk.naver.com', 'www.instagram.com', 'www.ftc.go.kr'];

test.use({ viewport: { width: 1440, height: 900 } });
// The shared dev-1 storefront needs several seconds per page load and hydration; tests that
// load two or more pages need more than the 30 s default.
test.describe.configure({ timeout: 90_000 });

// KNOW-AUTO-002: server-rendered controls are visible before hydration; wait for Nuxt.
async function waitForHydration(page: Page) {
  await page.waitForFunction(
    () => (document.getElementById('__nuxt') as any)?.__vue_app__?.$nuxt?.isHydrating === false,
    null, { timeout: 30_000 }
  );
}

async function gotoReady(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  await waitForHydration(page);
  return response;
}

function note(testInfo: TestInfo, type: string, description: string) {
  testInfo.annotations.push({ type, description });
}

function footerOf(page: Page) {
  return page.getByTestId('category-footer');
}

function column(page: Page, heading: string): Locator {
  return footerOf(page).getByTestId('category-footer-links').locator(':scope > div')
    .filter({ has: page.getByText(heading, { exact: true }) });
}

type Item = { tag: string; text: string; href: string | null; resolved: string | null; target: string | null; rel: string | null };

async function readItems(list: Locator): Promise<Item[]> {
  return list.locator('li > a, li > button').evaluateAll(elements => elements.map(element => ({
    tag: element.tagName.toLowerCase(),
    text: (element.textContent || '').trim(),
    href: element.getAttribute('href'),
    resolved: element instanceof HTMLAnchorElement ? element.href : null,
    target: element.getAttribute('target'),
    rel: element.getAttribute('rel')
  })));
}

async function footerTable(page: Page) {
  const footer = footerOf(page);
  return footer.evaluate(element => ({
    columns: [...element.querySelectorAll('[data-testid="category-footer-links"] > div')].map(col => ({
      heading: (col.querySelector('p')?.textContent || '').trim(),
      items: [...col.querySelectorAll('li > a, li > button')].map(i => [i.tagName, (i.textContent || '').trim(), i.getAttribute('href'), i.getAttribute('target')].join('|'))
    })),
    contact: [...element.querySelectorAll('[data-testid="category-footer-contact"] a')].map(a => [(a.textContent || '').trim(), a.getAttribute('href'), a.getAttribute('target')].join('|')),
    lower: [...element.querySelectorAll('[data-testid="category-footer-business"] p')].map(p => (p.textContent || '').replace(/\s+/g, ' ').trim()),
    lowerLinks: [...element.querySelectorAll('[data-testid="category-footer-business"] a, [data-testid="category-footer-business"] button')].map(i => [i.tagName, (i.textContent || '').trim(), i.getAttribute('href'), i.getAttribute('target')].join('|'))
  }));
}

function reviewsHeading(page: Page) {
  return page.locator('#reviews').getByRole('heading').first();
}

function faqVisibleQuestions(page: Page) {
  return page.locator('.mu-accordion-item:visible');
}

async function expectOpenerIntact(opener: Page, origin: string) {
  await expect(opener).toHaveURL(`${origin}/kr`);
  await opener.mouse.wheel(0, -2000);
  await expect.poll(() => opener.evaluate(() => window.scrollY)).toBeLessThan(10);
  await expect(footerOf(opener)).toBeAttached();
}

test.describe('GLOP-1988 footer on /kr @regression', () => {
  test.beforeEach(async ({ page }) => {
    await gotoReady(page, '/kr');
  });

  test('[GLOP-1988-TC-001] footer columns are 제품 / 주문 안내 / 혜택·지원 / 회사 (AC-01) @smoke', async ({ page }) => {
    const headings = footerOf(page).getByTestId('category-footer-links').locator(':scope > div > p');
    await expect(headings).toHaveText(['제품', '주문 안내', '혜택·지원', '회사']);
  });

  test('[GLOP-1988-TC-002] 혜택·지원 has exactly 3 items in order and no 무료 샘플팩 신청 (AC-02) @smoke', async ({ page }, testInfo) => {
    note(testInfo, 'known-defect', 'Build 0838-20261028 renders "대량주문-기업 견적" (hyphen); expected "대량주문·기업 견적" per Figma (QA owner decision 2026-10-28: follow Figma over the redirection guide). GLOP-1988-BUG-003; this assertion fails until fixed.');
    await expect(footerOf(page).getByText('무료 샘플팩 신청')).toHaveCount(0);
    const items = column(page, '혜택·지원').getByRole('listitem');
    await expect(items).toHaveCount(3);
    note(testInfo, 'observed-labels', (await items.allTextContents()).map(t => t.trim()).join(' / '));
    await expect(items).toHaveText(MIDDLE_DOT_LABELS);
  });

  test('[GLOP-1988-TC-003] old 정책 column and 대량주문ㆍ제휴문의 button are removed (AC-16)', async ({ page }) => {
    const footer = footerOf(page);
    await expect(footer.getByTestId('category-footer-links').getByText('정책', { exact: true })).toHaveCount(0);
    await expect(footer.getByText(/대량주문[ㆍ·]\s?제휴문의/)).toHaveCount(0);
    await expect(column(page, '회사').getByRole('button', { name: /대량주문/ })).toHaveCount(0);
  });

  test('[GLOP-1988-TC-004] 제품 column hrefs and same-tab target match the guide (AC-03)', async ({ page, apps }) => {
    const origin = new URL(apps.storefront!).origin;
    const items = await readItems(column(page, '제품'));
    expect(items.map(i => i.text)).toEqual(['스티커', '롤스티커', '판스티커', '홀로그램 스티커', '글자 커팅 스티커']);
    expect(items.map(i => i.resolved)).toEqual(['/kr/stickers', '/kr/roll-stickers', '/kr/sheet-stickers', '/kr/stickers/hologram-sticker', '/kr/stickers/vinyl-lettering'].map(p => origin + p));
    for (const item of items) {
      expect(item.tag, item.text).toBe('a');
      expect(item.target, `${item.text} must open in the same tab`).not.toBe('_blank');
    }
  });

  test('[GLOP-1988-TC-006] 주문 방법 opens FAQ on topic 주문 (AC-04)', async ({ page }) => {
    await column(page, '주문 안내').getByRole('link', { name: '주문 방법', exact: true }).click();
    await expect(page).toHaveURL(/\/kr\/faq(\?|$)/);
    await waitForHydration(page);
    await expect(page.locator('.nav-option.selected')).toHaveText(['주문']);
    await expect(faqVisibleQuestions(page)).toHaveCount(6);
    await expect(page.locator('.mu-accordion-item.is-open')).toHaveCount(0);
  });

  test('[GLOP-1988-TC-007] 파일 가이드 opens FAQ on topic 디자인 파일 업로드 (AC-05)', async ({ page }) => {
    await column(page, '주문 안내').getByRole('link', { name: '파일 가이드', exact: true }).click();
    await expect(page).toHaveURL(/\/kr\/faq(\?|$)/);
    await waitForHydration(page);
    await expect(page.locator('.nav-option.selected')).toHaveText(['디자인 파일 업로드']);
    await expect(faqVisibleQuestions(page)).toHaveCount(9);
    await expect(page.locator('.mu-accordion-item.is-open')).toHaveCount(0);
  });

  test('[GLOP-1988-TC-008] 배송 안내 opens FAQ on 주문 with the shipping question expanded (AC-06)', async ({ page }) => {
    await column(page, '주문 안내').getByRole('link', { name: '배송 안내', exact: true }).click();
    await expect(page).toHaveURL(/\/kr\/faq(\?|$)/);
    await waitForHydration(page);
    await expect(page.locator('.nav-option.selected')).toHaveText(['주문']);
    await expect(faqVisibleQuestions(page)).toHaveCount(6);
    const open = page.locator('.mu-accordion-item.is-open');
    await expect(open).toHaveCount(1);
    await expect(open.locator('.mu-accordion-trigger')).toHaveText('주문 후 제작 및 발송은 언제부터 시작되나요?');
  });

  test('[GLOP-1988-TC-008] 배송 안내 answer is fully in the viewport (AC-06, known OBS-B1)', async ({ page }) => {
    // Pre-existing OBS-B1 (dev-1 and production baseline 2026-10-27): the question is opened
    // but the page is not scrolled to it. Marked expected-to-fail so it does not hide the
    // TC-008 state checks above; Playwright reports it if the behaviour starts passing.
    test.fail(true, 'Known pre-existing OBS-B1: shipping question opened but not scrolled into view.');
    await column(page, '주문 안내').getByRole('link', { name: '배송 안내', exact: true }).click();
    await expect(page).toHaveURL(/\/kr\/faq(\?|$)/);
    await waitForHydration(page);
    await expect(page.locator('.mu-accordion-item.is-open .mu-accordion-content')).toBeInViewport({ ratio: 1 });
  });

  test('[GLOP-1988-TC-009] 재인쇄ㆍ환불안내 opens FAQ on topic 반품/환불 (AC-07)', async ({ page }, testInfo) => {
    const link = column(page, '주문 안내').getByRole('link', { name: /재인쇄[ㆍ·]\s?환불\s?안내/ });
    note(testInfo, 'observed-label', (await link.textContent())?.trim() || '');
    await link.click();
    await expect(page).toHaveURL(/\/kr\/faq(\?|$)/);
    await waitForHydration(page);
    await expect(page.locator('.nav-option.selected')).toHaveText(['반품/환불']);
    await expect(faqVisibleQuestions(page)).toHaveCount(5);
    await expect(page.locator('.mu-accordion-item.is-open')).toHaveCount(0);
  });

  test('[GLOP-1988-TC-010] 자주 묻는 질문 opens FAQ in its default state (AC-08)', async ({ page }, testInfo) => {
    await column(page, '주문 안내').getByRole('link', { name: '자주 묻는 질문', exact: true }).click();
    await expect(page).toHaveURL(/\/kr\/faq$/);
    await waitForHydration(page);
    const selected = page.locator('.nav-option.selected');
    await expect(selected).toHaveCount(1);
    note(testInfo, 'observed-default-topic', (await selected.textContent())?.trim() || '');
    await expect(page.locator('.mu-accordion-item.is-open')).toHaveCount(0);
  });

  test('[GLOP-1988-TC-013] 브랜드 소개 opens /kr/about in a new tab (AC-12)', async ({ page, context, apps }) => {
    const origin = new URL(apps.storefront!).origin;
    const link = column(page, '회사').getByRole('link', { name: '브랜드 소개', exact: true });
    await expect(link).toHaveAttribute('target', '_blank');
    const [about] = await Promise.all([context.waitForEvent('page'), link.click()]);
    await about.waitForLoadState('domcontentloaded');
    await expect(about).toHaveURL(`${origin}/kr/about`);
    await expect(about.getByRole('heading', { level: 1 })).toBeVisible();
    await expectOpenerIntact(page, origin);
  });

  test('[GLOP-1988-TC-014] 공지사항 opens /kr/announcements in the same tab (AC-12)', async ({ page, context, apps }) => {
    const origin = new URL(apps.storefront!).origin;
    const link = column(page, '회사').getByRole('link', { name: '공지사항', exact: true });
    await expect(link).not.toHaveAttribute('target', '_blank');
    const pagesBefore = context.pages().length;
    await link.click();
    await expect(page).toHaveURL(`${origin}/kr/announcements`);
    await expect(page.getByRole('heading', { level: 1, name: '공지사항' })).toBeVisible();
    expect(context.pages()).toHaveLength(pagesBefore);
  });

  test('[GLOP-1988-TC-015] careers item is under 회사 with /kr/careers and target _blank (AC-10)', async ({ page, apps }, testInfo) => {
    const origin = new URL(apps.storefront!).origin;
    const items = await readItems(column(page, '회사'));
    expect(items.map(i => i.text)).toEqual(['브랜드 소개', '공지사항', expect.stringMatching(/^(인재채용|채용정보)$/), '고객리뷰']);
    const careers = items[2];
    note(testInfo, 'observed-careers', `${careers.text} ${careers.href} target=${careers.target} rel=${careers.rel}`);
    expect(careers.tag).toBe('a');
    expect(careers.resolved).toBe(`${origin}/kr/careers`);
    expect(careers.target).toBe('_blank');
    await expect(column(page, '혜택·지원').getByText(/인재채용|채용정보/)).toHaveCount(0);
  });

  test('[GLOP-1988-TC-016] careers link opens the careers page in a new tab, opener intact (AC-10, AC-11)', async ({ page, context, apps }) => {
    const origin = new URL(apps.storefront!).origin;
    const careers = NEW_PAGES[3];
    const [opened] = await Promise.all([context.waitForEvent('page'), column(page, '회사').getByRole('link', { name: /^(인재채용|채용정보)$/ }).click()]);
    await opened.waitForLoadState('domcontentloaded');
    await expect(opened).toHaveURL(origin + careers.path);
    await expect(opened).toHaveTitle(careers.title);
    await expect(opened.locator('#contact').getByText(careers.formHeading, { exact: true })).toBeVisible();
    await expectOpenerIntact(page, origin);
  });

  test('[GLOP-1988-TC-017] 고객리뷰 on Home scrolls to Reviews in place (AC-13)', async ({ page, context, apps }, testInfo) => {
    const origin = new URL(apps.storefront!).origin;
    await page.evaluate(() => { (window as any).__qaNoReload = true; });
    const pagesBefore = context.pages().length;
    await column(page, '회사').getByRole('button', { name: '고객리뷰', exact: true }).click();
    await expect(reviewsHeading(page)).toBeInViewport();
    await expect(page).toHaveURL(new RegExp(`^${origin}/kr/?(#reviews)?$`));
    expect(await page.evaluate(() => (window as any).__qaNoReload), 'page must not reload').toBe(true);
    expect(context.pages()).toHaveLength(pagesBefore);
    note(testInfo, 'observed-url', page.url());
  });

  test('[GLOP-1988-TC-019] 고객리뷰 on /kr/stickers scrolls to its own Reviews, repeat clicks stay (AC-13)', async ({ page, apps }) => {
    const origin = new URL(apps.storefront!).origin;
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await gotoReady(page, '/kr/stickers');
    await expect(page.locator('#reviews')).toBeAttached();
    const button = column(page, '회사').getByRole('button', { name: '고객리뷰', exact: true });
    await button.click();
    await expect(reviewsHeading(page)).toBeInViewport();
    await expect(page).toHaveURL(new RegExp(`^${origin}/kr/stickers(#reviews)?$`));
    await button.dblclick();
    await expect(reviewsHeading(page)).toBeInViewport();
    await expect(page).toHaveURL(new RegExp(`^${origin}/kr/stickers(#reviews)?$`));
    expect(errors).toEqual([]);
  });

  test('[GLOP-1988-TC-020] 혜택·지원 hrefs are dev-host routes opening in a new tab (AC-09, AC-24)', async ({ page, apps }, testInfo) => {
    const origin = new URL(apps.storefront!).origin;
    const items = await readItems(column(page, '혜택·지원'));
    expect(items.map(i => i.resolved)).toEqual(NEW_PAGES.slice(0, 3).map(p => origin + p.path));
    for (const item of items) {
      expect(item.tag, item.text).toBe('a');
      expect(item.target, item.text).toBe('_blank');
      expect(new URL(item.resolved!).hostname, item.text).not.toMatch(/^(www\.)?musticker\.com$/);
      note(testInfo, 'observed-rel', `${item.text}: rel=${item.rel}`);
    }
  });

  for (const [index, target] of NEW_PAGES.slice(0, 3).entries()) {
    const caseId = `GLOP-1988-TC-0${21 + index}`;
    test(`[${caseId}] ${target.label} opens ${target.path} in a new tab, opener intact (AC-09, AC-11)`, async ({ page, context, apps }, testInfo) => {
      const origin = new URL(apps.storefront!).origin;
      if (index === 1) note(testInfo, 'known-defect', 'Footer label is "대량주문-기업 견적" on 0838-20261028; the link is located by href so this case checks navigation only (the label is asserted in TC-002, GLOP-1988-BUG-003).');
      // Located by href: the label itself is asserted in TC-002.
      const link = column(page, '혜택·지원').locator(`a[href="${target.path}"]`);
      const [opened] = await Promise.all([context.waitForEvent('page'), link.click()]);
      await opened.waitForLoadState('domcontentloaded');
      await expect(opened).toHaveURL(origin + target.path);
      await expect(opened).toHaveTitle(target.title);
      await expect(opened.locator('#contact').getByText(target.formHeading, { exact: true })).toBeVisible();
      await expectOpenerIntact(page, origin);
    });
  }

  test('[GLOP-1988-TC-024] policy links sit on their own lower-footer line, not in the columns (AC-14)', async ({ page }, testInfo) => {
    const lines = footerOf(page).getByTestId('category-footer-business').locator('p');
    await expect(lines).toHaveCount(4);
    await expect(lines.nth(0)).toContainText('(주)글로픽스');
    await expect(lines.nth(1)).toContainText('호스팅');
    await expect(lines.nth(2)).toHaveText(/^\s*이용약관\s*·\s*개인정보처리방침\s*·\s*사업자정보확인\s*·\s*오픈소스\s?고지\s*$/);
    await expect(lines.nth(3)).toContainText('© 2026 GLOPHICS Corp. All rights reserved.');
    note(testInfo, 'observed-policy-line', ((await lines.nth(2).textContent()) || '').replace(/\s+/g, ' ').trim());
    const columns = footerOf(page).getByTestId('category-footer-links');
    for (const label of ['이용약관', '개인정보처리방침', '사업자정보확인', /오픈소스\s?고지/]) {
      await expect(columns.getByText(label)).toHaveCount(0);
    }
  });

  test('[GLOP-1988-TC-025] policy hrefs and new-tab targets; 사업자정보확인 opens the FTC page (AC-15)', async ({ page, context, apps }, testInfo) => {
    const origin = new URL(apps.storefront!).origin;
    const line = footerOf(page).getByTestId('category-footer-business');
    for (const policy of POLICY_LINKS) {
      const link = line.getByRole('link', { name: policy.label });
      await expect(link).toHaveAttribute('target', '_blank');
      expect(await link.evaluate(a => (a as HTMLAnchorElement).href)).toBe(origin + policy.path);
    }
    // Third party: never load ftc.go.kr. The popup request is aborted and only its URL is asserted.
    await context.route(url => url.hostname.endsWith('ftc.go.kr'), route => route.abort('blockedbyclient'));
    const business = line.getByRole('button', { name: '사업자정보확인', exact: true });
    note(testInfo, 'finding', '사업자정보확인 is a <button> calling window.open (the case expected an <a target=_blank>; baseline was also a button). Outcome asserted: popup to the FTC URL.');
    const [popup, request] = await Promise.all([
      page.waitForEvent('popup'),
      context.waitForEvent('request', r => new URL(r.url()).hostname.endsWith('ftc.go.kr')),
      business.click()
    ]);
    expect(request.url()).toBe(FTC_URL);
    await popup.close();
    await expect(page).toHaveURL(`${origin}/kr`);
  });

  test('[GLOP-1988-TC-026] internal policy links open in a new tab and load (AC-15)', async ({ page, context, apps }) => {
    const origin = new URL(apps.storefront!).origin;
    const line = footerOf(page).getByTestId('category-footer-business');
    for (const policy of POLICY_LINKS) {
      await test.step(String(policy.path), async () => {
        const responsePromise = context.waitForEvent('response', r => r.url() === origin + policy.path && r.request().isNavigationRequest());
        const [opened] = await Promise.all([context.waitForEvent('page'), line.getByRole('link', { name: policy.label }).click()]);
        const response = await responsePromise;
        expect(response.status(), policy.path).toBe(200);
        await expect(opened).toHaveURL(origin + policy.path);
        await expect(opened.getByRole('heading', { level: 1 })).toBeVisible();
        await opened.close();
        await expect(page).toHaveURL(`${origin}/kr`);
      });
    }
  });

  test('[GLOP-1988-TC-027] footer right block (고객센터, hours, email, social) unchanged (AC-18)', async ({ page }) => {
    const contact = footerOf(page).getByTestId('category-footer-contact');
    await expect(contact.getByText('고객센터', { exact: true })).toBeVisible();
    await expect(contact.getByRole('link', { name: '1899-5529' })).toHaveAttribute('href', 'tel:1899-5529');
    await expect(contact).toContainText(/평일 09:00 – 18:00\s*· 토·일·공휴일 휴무/);
    await expect(contact.getByRole('link', { name: 'sales@musticker.com' })).toHaveAttribute('href', 'mailto:sales@musticker.com');
    const instagram = contact.getByRole('link', { name: /instagram/i });
    await expect(instagram).toHaveAttribute('href', /^https:\/\/www\.instagram\.com\/musticker_official\/?$/);
    await expect(instagram).toHaveAttribute('target', '_blank');
    const kakao = contact.getByRole('link', { name: 'KakaoTalk Channel' });
    await expect(kakao).toHaveAttribute('href', /^https:\/\/pf\.kakao\.com\//);
    await expect(kakao).toHaveAttribute('target', '_blank');
  });

  test('[GLOP-1988-TC-028] lower footer company, address and copyright lines unchanged (AC-14, AC-18)', async ({ page }) => {
    const lines = footerOf(page).getByTestId('category-footer-business').locator('p');
    await expect(lines.nth(0)).toHaveText('(주)글로픽스 · 대표 여일석 · 사업자번호 877-88-03313 · 통신판매업신고 2026-부산해운대-0792호');
    await expect(lines.nth(1)).toHaveText('부산광역시 해운대구 해운대해변로 203 오션타워 1014호 · 호스팅 Amazon Web Services');
    await expect(lines.nth(3)).toHaveText('© 2026 GLOPHICS Corp. All rights reserved.');
  });
});

test('[GLOP-1988-TC-018] 고객리뷰 on pages without Reviews goes to Home scrolled to Reviews (AC-13) @regression', async ({ page, context, apps }) => {
  test.setTimeout(120_000);
  const origin = new URL(apps.storefront!).origin;
  for (const start of ['/kr/faq', '/kr/announcements', '/kr/institutions']) {
    await test.step(start, async () => {
      await gotoReady(page, start);
      await expect(page.locator('#reviews')).toHaveCount(0);
      const pagesBefore = context.pages().length;
      await column(page, '회사').getByRole('button', { name: '고객리뷰', exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`^${origin}/kr/?(#reviews)?$`));
      await expect(reviewsHeading(page)).toBeInViewport({ timeout: 15_000 });
      expect(context.pages()).toHaveLength(pagesBefore);
    });
  }
});

test('[GLOP-1988-TC-029] footer identical across page types (AC-01, AC-03, AC-09, AC-10, AC-12, AC-14, AC-15, AC-18) @regression', async ({ page }) => {
  test.setTimeout(240_000);
  await gotoReady(page, '/kr');
  const reference = await footerTable(page);
  const pages = ['/kr/stickers', '/kr/faq', '/kr/about', '/kr/announcements', '/kr/terms-of-use', ...NEW_PAGES.map(p => p.path)];
  for (const path of pages) {
    await test.step(path, async () => {
      const response = await gotoReady(page, path);
      expect.soft(response?.status(), `${path} status`).toBe(200);
      await expect.soft(footerOf(page), `${path} footer`).toBeAttached();
      expect.soft(await footerTable(page), `${path} footer differs from /kr`).toEqual(reference);
    });
  }
});

test.describe('GLOP-1988 new pages @regression', () => {
  for (const target of NEW_PAGES) {
    test(`[GLOP-1988-TC-037] ${target.path} loads directly with title and form heading, no uncaught errors (AC-11)`, async ({ page }, testInfo) => {
      const pageErrors: string[] = [];
      const consoleErrors: string[] = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      page.on('console', message => {
        if (message.type() !== 'error') return;
        const source = message.location().url;
        // Anonymous session probe: GET <api>/sys/kr/user/me answers 401 for signed-out visitors.
        if (/\/user\/me(\?|$)/.test(source)) note(testInfo, 'console-401-user-me', `${message.text()} ${source}`);
        else consoleErrors.push(`${message.text()} ${source}`);
      });
      for (const attempt of ['load', 'reload']) {
        await test.step(attempt, async () => {
          const response = attempt === 'load' ? await page.goto(target.path, { waitUntil: 'domcontentloaded' }) : await page.reload({ waitUntil: 'domcontentloaded' });
          await waitForHydration(page);
          expect(response?.status()).toBe(200);
          await expect(page).toHaveTitle(target.title);
          await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
          await expect(page.locator('#contact').getByText(target.formHeading, { exact: true })).toBeVisible();
        });
      }
      expect(pageErrors, 'uncaught page errors').toEqual([]);
      expect(consoleErrors, 'console errors').toEqual([]);
    });

    test(`[GLOP-1988-TC-038] ${target.path} links point to the dev host, never production (AC-24)`, async ({ page, apps }, testInfo) => {
      const origin = new URL(apps.storefront!).origin;
      await gotoReady(page, target.path);
      const urls = await page.evaluate(() => ({
        links: [...document.querySelectorAll('a[href]')].map(a => (a as HTMLAnchorElement).href),
        actions: [...document.querySelectorAll('form')].map(f => f.getAttribute('action')).filter(Boolean).map(a => new URL(a!, location.href).href),
        meta: [document.querySelector('link[rel="canonical"]')?.getAttribute('href'), document.querySelector('meta[property="og:url"]')?.getAttribute('content')].filter(Boolean) as string[]
      }));
      const web = [...urls.links, ...urls.actions].filter(u => /^https?:/.test(u));
      const production = web.filter(u => PRODUCTION_HOSTS.includes(new URL(u).hostname));
      expect(production, 'links or form actions targeting production').toEqual([]);
      const thirdParty = [...new Set(web.map(u => new URL(u).hostname).filter(h => h !== new URL(origin).hostname))];
      note(testInfo, 'third-party-hosts', thirdParty.join(', ') || 'none');
      expect(thirdParty.filter(h => !EXPECTED_THIRD_PARTY_HOSTS.includes(h)), 'unexpected third-party link hosts').toEqual([]);
      for (const meta of urls.meta) {
        if (PRODUCTION_HOSTS.includes(new URL(meta, origin).hostname)) note(testInfo, 'observation-canonical-production', meta);
      }
      // Click two same-tab internal links and confirm the landing URL stays on the dev host.
      for (const [name, path] of [['스티커', '/kr/stickers'], ['공지사항', '/kr/announcements']]) {
        await test.step(`click footer ${name}`, async () => {
          await footerOf(page).getByRole('link', { name, exact: true }).click();
          await expect(page).toHaveURL(origin + path);
          await gotoReady(page, target.path);
        });
      }
    });
  }
});
